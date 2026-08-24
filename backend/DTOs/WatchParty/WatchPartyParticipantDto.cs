using System.Text.Json.Serialization;

namespace YouTubeClone.Api.DTOs.WatchParty;

public sealed class WatchPartyParticipantDto
{
    [JsonIgnore]
    public string SessionId { get; init; } =
        string.Empty;

    public Guid? UserId { get; init; }

    public string UserName { get; init; } =
        string.Empty;

    public bool IsHost { get; init; }

    public DateTimeOffset JoinedAt { get; init; }
}