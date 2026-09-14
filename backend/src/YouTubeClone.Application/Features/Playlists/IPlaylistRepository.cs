using YouTubeClone.Domain.Playlists;

namespace YouTubeClone.Application.Features.Playlists;

public interface IPlaylistRepository
{
    Task<IReadOnlyList<Playlist>> ListByOwnerAsync(
        Guid ownerId,
        CancellationToken cancellationToken);

    Task<Playlist?> FindByIdAsync(
        Guid playlistId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Guid>> ListVideoIdsAsync(
        Guid playlistId,
        CancellationToken cancellationToken);

    Task<PlaylistVideo?> FindVideoAsync(
        Guid playlistId,
        Guid videoId,
        CancellationToken cancellationToken);

    void Add(Playlist playlist);

    void Remove(Playlist playlist);

    void AddVideo(PlaylistVideo playlistVideo);

    void RemoveVideo(PlaylistVideo playlistVideo);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}
