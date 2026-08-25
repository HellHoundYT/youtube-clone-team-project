using YouTubeClone.Application.Features.Streams.Contracts;
using YouTubeClone.Domain.Streams;

namespace YouTubeClone.Application.Features.Streams;

public sealed class LiveStreamService :
    ILiveStreamService
{
    private readonly ILiveStreamRepository
        _repository;

    public LiveStreamService(
        ILiveStreamRepository repository)
    {
        _repository =
            repository;
    }

    public async Task<IReadOnlyList<LiveStreamListItemDto>>
        GetLiveStreamsAsync(
            string? category = null,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var streams =
            await _repository.GetAllAsync(
                cancellationToken);

        IEnumerable<LiveStream> query =
            streams.Where(
                stream =>
                    stream.IsLive);

        if (!string.IsNullOrWhiteSpace(
                category))
        {
            var normalizedCategory =
                category.Trim();

            query =
                query.Where(
                    stream =>
                        string.Equals(
                            stream.Category,
                            normalizedCategory,
                            StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(
                            stream.CategorySlug,
                            normalizedCategory,
                            StringComparison.OrdinalIgnoreCase));
        }

        return query
            .OrderByDescending(
                stream =>
                    stream.ViewerCount)
            .Select(
                ToListItem)
            .ToList();
    }

    public async Task<LiveStreamDetailsDto?>
        GetLiveStreamByIdAsync(
            Guid streamId,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var streams =
            await _repository.GetAllAsync(
                cancellationToken);

        var stream =
            streams.FirstOrDefault(
                item =>
                    item.Id == streamId &&
                    item.IsLive);

        return stream is null
            ? null
            : ToDetails(
                stream);
    }

    public async Task<IReadOnlyList<StreamCategoryDto>>
        GetCategoriesAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var streams =
            await _repository.GetAllAsync(
                cancellationToken);

        return streams
            .Where(
                stream =>
                    stream.IsLive)
            .GroupBy(
                stream =>
                    new
                    {
                        stream.Category,
                        stream.CategorySlug
                    })
            .Select(
                group =>
                    new StreamCategoryDto
                    {
                        Name =
                            group.Key.Category,

                        Slug =
                            group.Key.CategorySlug,

                        LiveStreamCount =
                            group.Count(),

                        ViewerCount =
                            group.Sum(
                                stream =>
                                    stream.ViewerCount)
                    })
            .OrderByDescending(
                category =>
                    category.ViewerCount)
            .ToList();
    }

    private static LiveStreamListItemDto
        ToListItem(
            LiveStream stream)
    {
        return new LiveStreamListItemDto
        {
            Id =
                stream.Id,

            ChannelId =
                stream.ChannelId,

            ChannelName =
                stream.ChannelName,

            ChannelAvatarPath =
                stream.ChannelAvatarPath,

            Title =
                stream.Title,

            Category =
                stream.Category,

            CategorySlug =
                stream.CategorySlug,

            ThumbnailPath =
                stream.ThumbnailPath,

            ViewerCount =
                stream.ViewerCount,

            IsLive =
                stream.IsLive,

            StartedAt =
                stream.StartedAt
        };
    }

    private static LiveStreamDetailsDto
        ToDetails(
            LiveStream stream)
    {
        return new LiveStreamDetailsDto
        {
            Id =
                stream.Id,

            ChannelId =
                stream.ChannelId,

            ChannelName =
                stream.ChannelName,

            ChannelAvatarPath =
                stream.ChannelAvatarPath,

            Title =
                stream.Title,

            Description =
                stream.Description,

            Category =
                stream.Category,

            CategorySlug =
                stream.CategorySlug,

            ThumbnailPath =
                stream.ThumbnailPath,

            PlaybackUrl =
                stream.PlaybackUrl,

            Tags =
                stream.Tags.ToArray(),

            ViewerCount =
                stream.ViewerCount,

            IsLive =
                stream.IsLive,

            StartedAt =
                stream.StartedAt
        };
    }
}