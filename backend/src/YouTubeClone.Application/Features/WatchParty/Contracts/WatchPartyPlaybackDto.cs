namespace YouTubeClone.Application.Features.WatchParty.Contracts;

public sealed class WatchPartyPlaybackDto
{
    public string RoomCode { get; init; } =
        string.Empty;

    public Guid? CurrentVideoId { get; init; }

    public double CurrentTime { get; init; }

    public bool IsPlaying { get; init; }

    public DateTimeOffset UpdatedAt { get; init; }
}