using YouTubeClone.Application.Features.Videos.Contracts;
using YouTubeClone.Domain.Videos;

namespace YouTubeClone.Application.Features.Videos;

public sealed class VideoService :
    IVideoService
{
    private readonly IVideoRepository
        _repository;

    public VideoService(
        IVideoRepository repository)
    {
        _repository =
            repository;
    }

    public async Task<IReadOnlyList<VideoListItemDto>>
        GetVideosAsync(
            int page,
            int pageSize,
            string? category,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var catalog =
            await _repository.GetAllAsync(
                cancellationToken);

        IEnumerable<Video> query =
            catalog;

        if (!string.IsNullOrWhiteSpace(
                category))
        {
            query =
                query.Where(
                    video =>
                        string.Equals(
                            video.Category,
                            category,
                            StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(
                            video.CategorySlug,
                            category,
                            StringComparison.OrdinalIgnoreCase));
        }

        return query
            .OrderByDescending(
                video =>
                    video.PublishedAt)
            .Skip(
                (page - 1) *
                pageSize)
            .Take(
                pageSize)
            .Select(
                ToListItemDto)
            .ToList();
    }

    public async Task<VideoDetailsDto?>
        GetVideoByIdAsync(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var video =
            await _repository.GetByIdAsync(
                videoId,
                cancellationToken);

        return video is null
            ? null
            : ToDetailsDto(
                video);
    }

    public Task<long?>
        RegisterViewAsync(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return _repository
            .IncrementViewCountAsync(
                videoId,
                cancellationToken);
    }

    public async Task<VideoDetailsDto>
        CreateVideoAsync(
            VideoDetailsDto video,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var domainVideo =
            ToDomain(
                video);

        var added =
            await _repository.TryAddAsync(
                domainVideo,
                cancellationToken);

        if (!added)
        {
            throw new InvalidOperationException(
                "A video with this identifier already exists.");
        }

        return ToDetailsDto(
            domainVideo);
    }

    private static VideoListItemDto
        ToListItemDto(
            Video video)
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

    private static VideoDetailsDto
        ToDetailsDto(
            Video video)
    {
        return new VideoDetailsDto
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

            Description =
                video.Description,

            VideoPath =
                video.VideoPath,

            ThumbnailPath =
                video.ThumbnailPath,

            DurationSeconds =
                video.DurationSeconds,

            ViewCount =
                video.ViewCount,

            Visibility =
                video.Visibility,

            PublishedAt =
                video.PublishedAt
        };
    }

    private static Video
        ToDomain(
            VideoDetailsDto video)
    {
        return new Video
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

            Description =
                video.Description,

            VideoPath =
                video.VideoPath,

            ThumbnailPath =
                video.ThumbnailPath,

            DurationSeconds =
                video.DurationSeconds,

            ViewCount =
                video.ViewCount,

            Visibility =
                video.Visibility,

            PublishedAt =
                video.PublishedAt
        };
    }
}