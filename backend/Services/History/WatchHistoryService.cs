using System.Collections.Concurrent;
using YouTubeClone.Api.DTOs.History;
using YouTubeClone.Api.DTOs.Videos;
using YouTubeClone.Api.Services.Videos;

namespace YouTubeClone.Api.Services.History;

public sealed class WatchHistoryService :
    IWatchHistoryService
{
    private sealed class HistoryEntry
    {
        public Guid VideoId { get; init; }

        public int ProgressSeconds { get; init; }

        public bool Completed { get; init; }

        public DateTimeOffset LastWatchedAt { get; init; }
    }

    private readonly ConcurrentDictionary<
        Guid,
        HistoryEntry> _history =
        new();

    private readonly IVideoService
        _videoService;

    private int _isPaused;

    public WatchHistoryService(
        IVideoService videoService)
    {
        _videoService =
            videoService;
    }

    public async Task<IReadOnlyList<WatchHistoryItemDto>>
        GetHistoryAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var entries = _history
            .Values
            .OrderByDescending(
                entry =>
                    entry.LastWatchedAt)
            .ToList();

        var result =
            new List<WatchHistoryItemDto>();

        foreach (var entry in entries)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var video =
                await _videoService.GetVideoByIdAsync(
                    entry.VideoId,
                    cancellationToken);

            if (video is null)
            {
                continue;
            }

            result.Add(
                ToHistoryItem(
                    entry,
                    video));
        }

        return result;
    }

    public async Task<WatchHistoryItemDto?>
        UpdateHistoryAsync(
            Guid videoId,
            int progressSeconds,
            bool completed,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var video =
            await _videoService.GetVideoByIdAsync(
                videoId,
                cancellationToken);

        if (video is null)
        {
            return null;
        }

        if (IsPaused())
        {
            return null;
        }

        var safeProgress =
            Math.Clamp(
                progressSeconds,
                0,
                video.DurationSeconds);

        if (completed)
        {
            safeProgress =
                video.DurationSeconds;
        }

        var entry =
            new HistoryEntry
            {
                VideoId =
                    videoId,
                ProgressSeconds =
                    safeProgress,
                Completed =
                    completed,
                LastWatchedAt =
                    DateTimeOffset.UtcNow
            };

        _history.AddOrUpdate(
            videoId,
            entry,
            (_, _) => entry);

        return ToHistoryItem(
            entry,
            video);
    }

    public Task<bool> RemoveHistoryItemAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var removed =
            _history.TryRemove(
                videoId,
                out _);

        return Task.FromResult(
            removed);
    }

    public Task ClearHistoryAsync(
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _history.Clear();

        return Task.CompletedTask;
    }

    public Task<HistoryStatusDto> GetStatusAsync(
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(
            new HistoryStatusDto
            {
                IsPaused =
                    IsPaused()
            });
    }

    public Task<HistoryStatusDto> SetPausedAsync(
        bool isPaused,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        Interlocked.Exchange(
            ref _isPaused,
            isPaused
                ? 1
                : 0);

        return Task.FromResult(
            new HistoryStatusDto
            {
                IsPaused =
                    IsPaused()
            });
    }

    private bool IsPaused()
    {
        return Volatile.Read(
            ref _isPaused) == 1;
    }

    private static WatchHistoryItemDto
        ToHistoryItem(
            HistoryEntry entry,
            VideoDetailsDto video)
    {
        return new WatchHistoryItemDto
        {
            VideoId =
                entry.VideoId,
            ProgressSeconds =
                entry.ProgressSeconds,
            Completed =
                entry.Completed,
            LastWatchedAt =
                entry.LastWatchedAt,
            Video =
                ToVideoListItem(
                    video)
        };
    }

    private static VideoListItemDto
        ToVideoListItem(
            VideoDetailsDto video)
    {
        return new VideoListItemDto
        {
            Id =
                video.Id,
            ChannelId =
                video.ChannelId,
            ChannelName =
                video.ChannelName,
            ChannelAvatarPath =
                video.ChannelAvatarPath,
            Category =
                video.Category,
            CategorySlug =
                video.CategorySlug,
            Title =
                video.Title,
            ThumbnailPath =
                video.ThumbnailPath,
            DurationSeconds =
                video.DurationSeconds,
            ViewCount =
                video.ViewCount,
            PublishedAt =
                video.PublishedAt
        };
    }
}