using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Features.Playlists;
using YouTubeClone.Domain.Playlists;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.Playlists;

public sealed class EfPlaylistRepository : IPlaylistRepository
{
    private readonly AppDbContext _db;

    public EfPlaylistRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Playlist>> ListByOwnerAsync(
        Guid ownerId,
        CancellationToken cancellationToken)
    {
        return await _db.Playlists
            .AsNoTracking()
            .Where(playlist => playlist.OwnerId == ownerId)
            .OrderByDescending(playlist => playlist.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<Playlist?> FindByIdAsync(
        Guid playlistId,
        CancellationToken cancellationToken) =>
        _db.Playlists.FirstOrDefaultAsync(
            playlist => playlist.Id == playlistId,
            cancellationToken);

    public void Add(Playlist playlist)
    {
        _db.Playlists.Add(playlist);
    }

    public void Remove(Playlist playlist)
    {
        _db.Playlists.Remove(playlist);
    }

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _db.SaveChangesAsync(cancellationToken);
    }
}
