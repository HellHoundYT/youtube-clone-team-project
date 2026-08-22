using YouTubeClone.Api.DTOs.Streams;

namespace YouTubeClone.Api.Services.Streams;

public interface ILiveStreamService
{
    Task<IReadOnlyList<LiveStreamListItemDto>>
        GetLiveStreamsAsync(
            string? category = null,
            CancellationToken cancellationToken = default);

    Task<LiveStreamDetailsDto?>
        GetLiveStreamByIdAsync(
            Guid streamId,
            CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StreamCategoryDto>>
        GetCategoriesAsync(
            CancellationToken cancellationToken = default);
}