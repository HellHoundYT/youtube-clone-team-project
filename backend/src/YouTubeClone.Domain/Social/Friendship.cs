namespace YouTubeClone.Domain.Social;

public static class FriendshipStatuses
{
    public const string Pending = "Pending";
    public const string Accepted = "Accepted";
}

public sealed class Friendship
{
    public Guid Id { get; set; }

    public Guid UserAId { get; set; }

    public Guid UserBId { get; set; }

    public Guid RequestedById { get; set; }

    public string Status { get; set; } =
        FriendshipStatuses.Pending;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
