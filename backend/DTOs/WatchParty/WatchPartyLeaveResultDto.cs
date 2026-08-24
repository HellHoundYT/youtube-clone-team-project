namespace YouTubeClone.Api.DTOs.WatchParty;

public sealed class WatchPartyLeaveResultDto
{
    public bool RoomClosed { get; init; }

    public WatchPartyRoomStateDto? Room { get; init; }
}