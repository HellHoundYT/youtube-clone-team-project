using YouTubeClone.Domain.History;

namespace YouTubeClone.Application.Features.History;

public interface IWatchHistoryRepository
{
    Task<IReadOnlyList<WatchHistoryEntry>>
        GetAllAsync(
            CancellationToken cancellationToken = default);

    Task UpsertAsync(
        WatchHistoryEntry entry,
        CancellationToken cancellationToken = default);

    Task<bool> RemoveAsync(
        Guid videoId,
        CancellationToken cancellationToken = default);

    Task ClearAsync(
        CancellationToken cancellationToken = default);

    Task<bool> IsPausedAsync(
        CancellationToken cancellationToken = default);

    Task<bool> SetPausedAsync(
        bool isPaused,
        CancellationToken cancellationToken = default);
}