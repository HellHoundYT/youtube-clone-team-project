using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Abstractions.Auth;
using YouTubeClone.Application.Features.History;
using YouTubeClone.Domain.History;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.History;

public sealed class EfWatchHistoryRepository : IWatchHistoryRepository
{
    private readonly AppDbContext _dbContext;
    private readonly ICurrentUserContext _currentUser;

    public EfWatchHistoryRepository(
        AppDbContext dbContext,
        ICurrentUserContext currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<WatchHistoryEntry>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        return await _dbContext.WatchHistoryEntries
            .AsNoTracking()
            .Where(entry => entry.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task UpsertAsync(
        WatchHistoryEntry entry,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        var stored = await _dbContext.WatchHistoryEntries
            .SingleOrDefaultAsync(
                item => item.UserId == userId && item.VideoId == entry.VideoId,
                cancellationToken);

        if (stored is null)
        {
            _dbContext.WatchHistoryEntries.Add(
                new WatchHistoryEntry
                {
                    UserId = userId,
                    VideoId = entry.VideoId,
                    ProgressSeconds = entry.ProgressSeconds,
                    Completed = entry.Completed,
                    LastWatchedAt = entry.LastWatchedAt
                });
        }
        else
        {
            stored.ProgressSeconds = entry.ProgressSeconds;
            stored.Completed = entry.Completed;
            stored.LastWatchedAt = entry.LastWatchedAt;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> RemoveAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        var stored = await _dbContext.WatchHistoryEntries
            .SingleOrDefaultAsync(
                item => item.UserId == userId && item.VideoId == videoId,
                cancellationToken);

        if (stored is null)
        {
            return false;
        }

        _dbContext.WatchHistoryEntries.Remove(stored);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task ClearAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        var entries = await _dbContext.WatchHistoryEntries
            .Where(entry => entry.UserId == userId)
            .ToListAsync(cancellationToken);

        if (entries.Count == 0)
        {
            return;
        }

        _dbContext.WatchHistoryEntries.RemoveRange(entries);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsPausedAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        return await _dbContext.WatchHistoryPreferences
            .AsNoTracking()
            .Where(preference => preference.UserId == userId)
            .Select(preference => preference.IsPaused)
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> SetPausedAsync(
        bool isPaused,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();

        var preference = await _dbContext.WatchHistoryPreferences
            .SingleOrDefaultAsync(
                item => item.UserId == userId,
                cancellationToken);

        if (preference is null)
        {
            _dbContext.WatchHistoryPreferences.Add(
                new WatchHistoryPreference
                {
                    UserId = userId,
                    IsPaused = isPaused
                });
        }
        else
        {
            preference.IsPaused = isPaused;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return isPaused;
    }

    private Guid GetRequiredUserId()
    {
        return _currentUser.UserId
            ?? throw new InvalidOperationException(
                "Watch history requires an authenticated user.");
    }
}
