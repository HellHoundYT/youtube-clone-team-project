namespace YouTubeClone.Domain.Social;

public sealed class WatchPartyInvitation
{
    public Guid Id { get; set; }

    public Guid SenderId { get; set; }

    public Guid RecipientId { get; set; }

    public string RoomCode { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }
}
