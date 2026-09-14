namespace YouTubeClone.Domain.Favorites;

public sealed class FavoriteEntry
{
    public Guid UserId { get; init; }

    public Guid VideoId { get; init; }

    public DateTimeOffset CreatedAt { get; init; }
}
