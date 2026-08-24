using YouTubeClone.Application.Features.Videos.Contracts;

namespace YouTubeClone.Application.Features.Favorites.Contracts;

public sealed class FavoriteItemDto
{
    public Guid VideoId { get; init; }

    public DateTimeOffset CreatedAt { get; init; }

    public VideoListItemDto Video { get; init; } =
        new();
}