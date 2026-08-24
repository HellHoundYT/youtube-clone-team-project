using System.Collections.Concurrent;
using YouTubeClone.Application.Features.Favorites;
using YouTubeClone.Domain.Favorites;

namespace YouTubeClone.Infrastructure.Favorites;

public sealed class InMemoryFavoritesRepository :
    IFavoritesRepository
{
    private readonly ConcurrentDictionary<
        Guid,
        FavoriteEntry> _favorites =
            new();

    public Task<IReadOnlyList<FavoriteEntry>>
        GetAllAsync(
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<FavoriteEntry> result =
            _favorites
                .Values
                .Select(
                    CreateSnapshot)
                .ToList();

        return Task.FromResult(
            result);
    }

    public Task<FavoriteEntry>
        GetOrAddAsync(
            FavoriteEntry entry,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var candidate =
            CreateSnapshot(
                entry);

        var stored =
            _favorites.GetOrAdd(
                entry.VideoId,
                candidate);

        return Task.FromResult(
            CreateSnapshot(
                stored));
    }

    public Task<bool>
        RemoveAsync(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var removed =
            _favorites.TryRemove(
                videoId,
                out _);

        return Task.FromResult(
            removed);
    }

    private static FavoriteEntry
        CreateSnapshot(
            FavoriteEntry entry)
    {
        return new FavoriteEntry
        {
            VideoId =
                entry.VideoId,

            CreatedAt =
                entry.CreatedAt
        };
    }
}