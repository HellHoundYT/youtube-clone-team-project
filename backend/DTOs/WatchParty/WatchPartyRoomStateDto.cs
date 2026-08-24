using System.Text.Json.Serialization;

namespace YouTubeClone.Api.DTOs.WatchParty;

public sealed class WatchPartyRoomStateDto
{
    public Guid RoomId { get; init; }

    public string RoomCode { get; init; } =
        string.Empty;

    [JsonIgnore]
    public string HostSessionId { get; init; } =
        string.Empty;

    public Guid? CurrentVideoId { get; init; }

    public double CurrentTime { get; init; }

    public bool IsPlaying { get; init; }

    public DateTimeOffset UpdatedAt { get; init; }

    public IReadOnlyList<WatchPartyParticipantDto>
        Participants { get; init; } =
            Array.Empty<WatchPartyParticipantDto>();

    public IReadOnlyList<WatchPartyMessageDto>
        Messages { get; init; } =
            Array.Empty<WatchPartyMessageDto>();
}