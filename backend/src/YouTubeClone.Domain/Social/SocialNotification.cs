namespace YouTubeClone.Domain.Social;

public static class SocialNotificationTypes
{
    public const string FriendRequest = "FriendRequest";
    public const string FriendAccepted = "FriendAccepted";
    public const string WatchPartyInvite = "WatchPartyInvite";
}

public sealed class SocialNotification
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Type { get; set; } = string.Empty;

    public Guid? ActorUserId { get; set; }

    public Guid? FriendshipId { get; set; }

    public Guid? WatchPartyInvitationId { get; set; }

    public string? TargetPath { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? ReadAt { get; set; }
}
