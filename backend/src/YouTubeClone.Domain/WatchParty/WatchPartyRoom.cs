namespace YouTubeClone.Domain.WatchParty;

public sealed class WatchPartyRoom
{
    public Guid RoomId { get; init; }

    public string RoomCode { get; init; } =
        string.Empty;

    public string HostSessionId { get; init; } =
        string.Empty;

    public Guid? CurrentVideoId { get; set; }

    public double CurrentTime { get; set; }

    public bool IsPlaying { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public Dictionary<
        string,
        WatchPartyParticipant> Participants { get; } =
            new(
                StringComparer.Ordinal);

    public List<WatchPartyMessage>
        Messages { get; } =
            new();
}