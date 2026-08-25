namespace YouTubeClone.Application.Features.WatchParty.Contracts;

public sealed class WatchPartyLeaveResultDto
{
    public bool RoomClosed { get; init; }

    public WatchPartyRoomStateDto? Room { get; init; }
}