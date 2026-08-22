using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Favorites;
using YouTubeClone.Api.Services.Favorites;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/favorites")]
public sealed class FavoritesController :
    ControllerBase
{
    private readonly IFavoritesService
        _favoritesService;

    public FavoritesController(
        IFavoritesService favoritesService)
    {
        _favoritesService =
            favoritesService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<FavoriteItemDto>),
        StatusCodes.Status200OK)]
    public async Task<
        ActionResult<IReadOnlyList<FavoriteItemDto>>>
        GetFavorites(
            CancellationToken cancellationToken)
    {
        var favorites =
            await _favoritesService.GetFavoritesAsync(
                cancellationToken);

        return Ok(favorites);
    }

    [HttpPost("{videoId:guid}")]
    [ProducesResponseType(
        typeof(FavoriteItemDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FavoriteItemDto>>
        AddFavorite(
            Guid videoId,
            CancellationToken cancellationToken)
    {
        var favorite =
            await _favoritesService.AddFavoriteAsync(
                videoId,
                cancellationToken);

        if (favorite is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Video was not found."
                });
        }

        return Ok(favorite);
    }

    [HttpDelete("{videoId:guid}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    public async Task<IActionResult>
        RemoveFavorite(
            Guid videoId,
            CancellationToken cancellationToken)
    {
        await _favoritesService.RemoveFavoriteAsync(
            videoId,
            cancellationToken);

        return NoContent();
    }
}