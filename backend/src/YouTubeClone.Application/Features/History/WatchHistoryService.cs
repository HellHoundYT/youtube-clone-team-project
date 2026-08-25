using YouTubeClone.Application.Features.History.Contracts;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Features.Videos.Contracts;
using YouTubeClone.Domain.History;

namespace YouTubeClone.Application.Features.History;

public sealed class WatchHistoryService :
    IWatchHistoryService
{
    private readonly IVideoService
        _videoService;

    private readonly IWatchHistoryRepository
        _repository;

    public WatchHistoryService(
        IVideoService videoService,
        IWatchHistoryRepository repository)
    {
        _videoService =
            videoService;

        _repository =
            repository;
    }

    public async Task<IReadOnlyList<WatchHistoryItemDto>>
        GetHistoryAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var entries =
            await _repository.GetAllAsync(
                cancellationToken);

        var orderedEntries =
            entries
                .OrderByDescending(
                    entry =>
                        entry.LastWatchedAt)
                .ToList();

        var result =
            new List<WatchHistoryItemDto>();

        foreach (var entry in orderedEntries)
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

        if (await _repository.IsPausedAsync(
                cancellationToken))
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
            new WatchHistoryEntry
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

        await _repository.UpsertAsync(
            entry,
            cancellationToken);

        return ToHistoryItem(
            entry,
            video);
    }

    public Task<bool>
        RemoveHistoryItemAsync(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return _repository.RemoveAsync(
            videoId,
            cancellationToken);
    }

    public Task
        ClearHistoryAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return _repository.ClearAsync(
            cancellationToken);
    }

    public async Task<HistoryStatusDto>
        GetStatusAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var isPaused =
            await _repository.IsPausedAsync(
                cancellationToken);

        return new HistoryStatusDto
        {
            IsPaused =
                isPaused
        };
    }

    public async Task<HistoryStatusDto>
        SetPausedAsync(
            bool isPaused,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var updatedState =
            await _repository.SetPausedAsync(
                isPaused,
                cancellationToken);

        return new HistoryStatusDto
        {
            IsPaused =
                updatedState
        };
    }

    private static WatchHistoryItemDto
        ToHistoryItem(
            WatchHistoryEntry entry,
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