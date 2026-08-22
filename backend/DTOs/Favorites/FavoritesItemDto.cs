using YouTubeClone.Api.DTOs.Videos;

namespace YouTubeClone.Api.DTOs.Favorites;

public sealed class FavoriteItemDto
{
    public Guid VideoId { get; init; }

    public DateTimeOffset CreatedAt { get; init; }

    public VideoListItemDto Video { get; init; } =
        new();
}