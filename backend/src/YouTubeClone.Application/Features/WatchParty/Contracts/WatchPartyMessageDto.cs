using System.Text.Json.Serialization;

namespace YouTubeClone.Application.Features.WatchParty.Contracts;

public sealed class WatchPartyMessageDto
{
    public Guid Id { get; init; }

    public string RoomCode { get; init; } =
        string.Empty;

    [JsonIgnore]
    public string SessionId { get; init; } =
        string.Empty;

    public Guid? UserId { get; init; }

    public string UserName { get; init; } =
        string.Empty;

    public string Message { get; init; } =
        string.Empty;

    public DateTimeOffset SentAt { get; init; }
}