using YouTubeClone.Application.Features.Videos.Contracts;

namespace YouTubeClone.Application.Features.Videos;

public interface IVideoService
{
    Task<IReadOnlyList<VideoListItemDto>> GetVideosAsync(
        int page,
        int pageSize,
        string? category,
        CancellationToken cancellationToken = default);

    Task<VideoDetailsDto?> GetVideoByIdAsync(
        Guid videoId,
        CancellationToken cancellationToken = default);

    Task<long?> RegisterViewAsync(
        Guid videoId,
        CancellationToken cancellationToken = default);

    Task<VideoDetailsDto> CreateVideoAsync(
        VideoDetailsDto video,
        CancellationToken cancellationToken = default);
}