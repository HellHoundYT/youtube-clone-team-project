using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Domain.Videos;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.Videos;

public sealed class EfVideoRepository : IVideoRepository
{
    private static readonly SemaphoreSlim SeedLock =
        new(1, 1);

    private readonly AppDbContext _dbContext;
    private bool _seedChecked;

    public EfVideoRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Video>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedDataAsync(cancellationToken);

        return await _dbContext.Videos
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Video?> GetByIdAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedDataAsync(cancellationToken);

        return await _dbContext.Videos
            .AsNoTracking()
            .SingleOrDefaultAsync(
                video => video.Id == videoId,
                cancellationToken);
    }

    public async Task<long?> IncrementViewCountAsync(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedDataAsync(cancellationToken);

        var video = await _dbContext.Videos
            .SingleOrDefaultAsync(
                item => item.Id == videoId,
                cancellationToken);

        if (video is null)
        {
            return null;
        }

        video.ViewCount++;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return video.ViewCount;
    }

    public async Task<bool> TryAddAsync(
        Video video,
        CancellationToken cancellationToken = default)
    {
        await EnsureSeedDataAsync(cancellationToken);

        if (await _dbContext.Videos.AnyAsync(
                item => item.Id == video.Id,
                cancellationToken))
        {
            return false;
        }

        _dbContext.Videos.Add(video);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            _dbContext.Entry(video).State = EntityState.Detached;
            return false;
        }
    }

    private async Task EnsureSeedDataAsync(
        CancellationToken cancellationToken)
    {
        if (_seedChecked)
        {
            return;
        }

        await SeedLock.WaitAsync(cancellationToken);

        try
        {
            if (_seedChecked)
            {
                return;
            }

            var seedCatalog = VideoSeedData.CreateCatalog();
            var seedIds = seedCatalog
                .Select(video => video.Id)
                .ToArray();

            var existingIds = await _dbContext.Videos
                .Where(video => seedIds.Contains(video.Id))
                .Select(video => video.Id)
                .ToListAsync(cancellationToken);

            if (existingIds.Count != seedIds.Length)
            {
                var existing = existingIds.ToHashSet();
                var missing = seedCatalog
                    .Where(video => !existing.Contains(video.Id))
                    .ToList();

                if (missing.Count > 0)
                {
                    _dbContext.Videos.AddRange(missing);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }

            _seedChecked = true;
        }
        finally
        {
            SeedLock.Release();
        }
    }
}
