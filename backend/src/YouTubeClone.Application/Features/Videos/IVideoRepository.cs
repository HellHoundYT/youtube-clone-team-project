using YouTubeClone.Domain.Videos;

namespace YouTubeClone.Application.Features.Videos;

public interface IVideoRepository
{
    Task<IReadOnlyList<Video>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<Video?> GetByIdAsync(
        Guid videoId,
        CancellationToken cancellationToken = default);

    Task<long?> IncrementViewCountAsync(
        Guid videoId,
        CancellationToken cancellationToken = default);

    Task<bool> TryAddAsync(
        Video video,
        CancellationToken cancellationToken = default);
}