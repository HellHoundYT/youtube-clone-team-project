using YouTubeClone.Domain.Favorites;

namespace YouTubeClone.Application.Features.Favorites;

public interface IFavoritesRepository
{
    Task<IReadOnlyList<FavoriteEntry>>
        GetAllAsync(
            CancellationToken cancellationToken = default);

    Task<FavoriteEntry>
        GetOrAddAsync(
            FavoriteEntry entry,
            CancellationToken cancellationToken = default);

    Task<bool>
        RemoveAsync(
            Guid videoId,
            CancellationToken cancellationToken = default);
}