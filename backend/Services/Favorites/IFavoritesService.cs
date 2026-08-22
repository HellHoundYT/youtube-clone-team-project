using YouTubeClone.Api.DTOs.Favorites;

namespace YouTubeClone.Api.Services.Favorites;

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