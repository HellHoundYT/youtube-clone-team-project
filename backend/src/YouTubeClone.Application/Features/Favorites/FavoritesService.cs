using YouTubeClone.Application.Features.Favorites.Contracts;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Features.Videos.Contracts;
using YouTubeClone.Domain.Favorites;

namespace YouTubeClone.Application.Features.Favorites;

public sealed class FavoritesService :
    IFavoritesService
{
    private readonly IVideoService
        _videoService;

    private readonly IFavoritesRepository
        _repository;

    public FavoritesService(
        IVideoService videoService,
        IFavoritesRepository repository)
    {
        _videoService =
            videoService;

        _repository =
            repository;
    }

    public async Task<IReadOnlyList<FavoriteItemDto>>
        GetFavoritesAsync(
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
                        entry.CreatedAt)
                .ToList();

        var result =
            new List<FavoriteItemDto>();

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

        var candidate =
            new FavoriteEntry
            {
                VideoId =
                    videoId,

                CreatedAt =
                    DateTimeOffset.UtcNow
            };

        var entry =
            await _repository.GetOrAddAsync(
                candidate,
                cancellationToken);

        return ToFavoriteItem(
            entry,
            video);
    }

    public Task<bool>
        RemoveFavoriteAsync(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return _repository.RemoveAsync(
            videoId,
            cancellationToken);
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