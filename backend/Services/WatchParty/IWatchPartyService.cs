using YouTubeClone.Api.DTOs.WatchParty;

namespace YouTubeClone.Api.Services.WatchParty;

public interface IWatchPartyService
{
    Task<WatchPartyRoomStateDto> CreateRoomAsync(
        string hostSessionId,
        string hostName,
        Guid? initialVideoId,
        CancellationToken cancellationToken = default);

    WatchPartyRoomStateDto JoinRoom(
        string roomCode,
        string sessionId,
        string userName);

    WatchPartyRoomStateDto GetRoomState(
        string roomCode);

    WatchPartyLeaveResultDto LeaveRoom(
        string roomCode,
        string sessionId);

    void CloseRoom(
        string roomCode,
        string hostSessionId);

    Task<WatchPartyPlaybackDto> SetVideoAsync(
        string roomCode,
        string hostSessionId,
        Guid videoId,
        CancellationToken cancellationToken = default);

    WatchPartyPlaybackDto SetPlaybackState(
        string roomCode,
        string hostSessionId,
        double currentTime,
        bool isPlaying);

    WatchPartyMessageDto AddMessage(
        string roomCode,
        string sessionId,
        string message);
}