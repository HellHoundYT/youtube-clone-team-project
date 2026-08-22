using System.Collections.Concurrent;
using YouTubeClone.Api.DTOs.Favorites;
using YouTubeClone.Api.DTOs.Videos;
using YouTubeClone.Api.Services.Videos;

namespace YouTubeClone.Api.Services.Favorites;

public sealed class FavoritesService :
    IFavoritesService
{
    private sealed class FavoriteEntry
    {
        public Guid VideoId { get; init; }

        public DateTimeOffset CreatedAt { get; init; }
    }

    private readonly ConcurrentDictionary<
        Guid,
        FavoriteEntry> _favorites =
        new();

    private readonly IVideoService
        _videoService;

    public FavoritesService(
        IVideoService videoService)
    {
        _videoService =
            videoService;
    }

    public async Task<IReadOnlyList<FavoriteItemDto>>
        GetFavoritesAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var entries =
            _favorites
                .Values
                .OrderByDescending(
                    item =>
                        item.CreatedAt)
                .ToList();

        var result =
            new List<FavoriteItemDto>();

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
                ToFavoriteItem(
                    entry,
                    video));
        }

        return result;
    }

    public async Task<FavoriteItemDto?>
        AddFavoriteAsync(
            Guid videoId,
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

        var newEntry =
            new FavoriteEntry
            {
                VideoId =
                    videoId,
                CreatedAt =
                    DateTimeOffset.UtcNow
            };

        var entry =
            _favorites.GetOrAdd(
                videoId,
                newEntry);

        return ToFavoriteItem(
            entry,
            video);
    }

    public Task<bool> RemoveFavoriteAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var removed =
            _favorites.TryRemove(
                videoId,
                out _);

        return Task.FromResult(
            removed);
    }

    private static FavoriteItemDto
        ToFavoriteItem(
            FavoriteEntry entry,
            VideoDetailsDto video)
    {
        return new FavoriteItemDto
        {
            VideoId =
                entry.VideoId,
            CreatedAt =
                entry.CreatedAt,
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