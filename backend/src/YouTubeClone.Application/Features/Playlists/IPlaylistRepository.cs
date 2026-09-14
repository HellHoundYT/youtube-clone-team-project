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

    void Add(Playlist playlist);

    void Remove(Playlist playlist);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}
