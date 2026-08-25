namespace YouTubeClone.Domain.LiveChat;

public sealed class LiveChatMessage
{
    public Guid Id { get; init; }

    public Guid StreamId { get; init; }

    public string SessionId { get; init; } =
        string.Empty;

    public Guid? UserId { get; init; }

    public string UserName { get; init; } =
        string.Empty;

    public string Message { get; set; } =
        string.Empty;

    public Guid? ParentMessageId { get; init; }

    public DateTimeOffset SentAt { get; init; }

    public DateTimeOffset? EditedAt { get; set; }

    public Dictionary<
        string,
        HashSet<string>> ReactionSessions { get; init; } =
            new(
                StringComparer.Ordinal);
}