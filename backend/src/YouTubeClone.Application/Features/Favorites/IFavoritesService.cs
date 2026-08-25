using YouTubeClone.Application.Features.Favorites.Contracts;

namespace YouTubeClone.Application.Features.Favorites;

public interface IFavoritesService
{
    Task<IReadOnlyList<FavoriteItemDto>>
        GetFavoritesAsync(
            CancellationToken cancellationToken = default);

    Task<FavoriteItemDto?> AddFavoriteAsync(
        Guid videoId,
        CancellationToken cancellationToken = default);

    Task<bool> RemoveFavoriteAsync(
        Guid videoId,
        CancellationToken cancellationToken = default);
}