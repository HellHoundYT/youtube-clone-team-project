namespace YouTubeClone.Application.Features.Playlists;

public interface IPlaylistService
{
    Task<IReadOnlyList<PlaylistModel>> ListAsync(
        Guid ownerId,
        CancellationToken cancellationToken);

    Task<PlaylistResult> CreateAsync(
        Guid ownerId,
        SavePlaylistCommand command,
        CancellationToken cancellationToken);

    Task<PlaylistResult> UpdateAsync(
        Guid ownerId,
        Guid playlistId,
        SavePlaylistCommand command,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(
        Guid ownerId,
        Guid playlistId,
        CancellationToken cancellationToken);
}
