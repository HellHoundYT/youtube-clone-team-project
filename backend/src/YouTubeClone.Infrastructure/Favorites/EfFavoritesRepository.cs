using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Abstractions.Auth;
using YouTubeClone.Application.Features.Favorites;
using YouTubeClone.Domain.Favorites;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.Favorites;

public sealed class EfFavoritesRepository : IFavoritesRepository
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserContext _currentUser;

    public EfFavoritesRepository(
        AppDbContext dbContext,
        ICurrentUserContext currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<FavoriteEntry>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        return await _dbContext.FavoriteEntries
            .AsNoTracking()
            .Where(entry => entry.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<FavoriteEntry> GetOrAddAsync(
        FavoriteEntry entry,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        var existing = await _dbContext.FavoriteEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(
                item => item.UserId == userId && item.VideoId == entry.VideoId,
                cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var candidate = new FavoriteEntry
        {
            UserId = userId,
            VideoId = entry.VideoId,
            CreatedAt = entry.CreatedAt
        };

        _dbContext.FavoriteEntries.Add(candidate);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return candidate;
        }
        catch (DbUpdateException)
        {
            _dbContext.Entry(candidate).State = EntityState.Detached;

            return await _dbContext.FavoriteEntries
                .AsNoTracking()
                .SingleAsync(
                    item => item.UserId == userId && item.VideoId == entry.VideoId,
                    cancellationToken);
        }
    }

    public async Task<bool> RemoveAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        var stored = await _dbContext.FavoriteEntries
            .SingleOrDefaultAsync(
                item => item.UserId == userId && item.VideoId == videoId,
                cancellationToken);

        if (stored is null)
        {
            return false;
        }

        _dbContext.FavoriteEntries.Remove(stored);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private Guid GetRequiredUserId()
    {
        return _currentUser.UserId
            ?? throw new InvalidOperationException(
                "Favorites require an authenticated user.");
    }
}
