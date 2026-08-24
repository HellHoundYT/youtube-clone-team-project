namespace YouTubeClone.Domain.WatchParty;

public sealed class WatchPartyMessage
{
    public Guid Id { get; init; }

    public string RoomCode { get; init; } =
        string.Empty;

    public string SessionId { get; init; } =
        string.Empty;

    public Guid? UserId { get; init; }

    public string UserName { get; init; } =
        string.Empty;

    public string Message { get; init; } =
        string.Empty;

    public DateTimeOffset SentAt { get; init; }
}