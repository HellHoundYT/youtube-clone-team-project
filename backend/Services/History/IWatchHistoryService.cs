using YouTubeClone.Api.DTOs.History;

namespace YouTubeClone.Api.Services.History;

public interface IWatchHistoryService
{
    Task<IReadOnlyList<WatchHistoryItemDto>>
        GetHistoryAsync(
            CancellationToken cancellationToken = default);

    Task<WatchHistoryItemDto?> UpdateHistoryAsync(
        Guid videoId,
        int progressSeconds,
        bool completed,
        CancellationToken cancellationToken = default);

    Task<bool> RemoveHistoryItemAsync(
        Guid videoId,
        CancellationToken cancellationToken = default);

    Task ClearHistoryAsync(
        CancellationToken cancellationToken = default);

    Task<HistoryStatusDto> GetStatusAsync(
        CancellationToken cancellationToken = default);

    Task<HistoryStatusDto> SetPausedAsync(
        bool isPaused,
        CancellationToken cancellationToken = default);
}