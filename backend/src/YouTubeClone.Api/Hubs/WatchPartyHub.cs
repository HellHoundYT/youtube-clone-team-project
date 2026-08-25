using Microsoft.AspNetCore.SignalR;
using YouTubeClone.Application.Features.WatchParty.Contracts;
using YouTubeClone.Application.Features.WatchParty;

namespace YouTubeClone.Api.Hubs;

public sealed class WatchPartyHub :
    Hub
{
    private readonly IWatchPartyService
        _watchPartyService;

    public WatchPartyHub(
        IWatchPartyService watchPartyService)
    {
        _watchPartyService =
            watchPartyService;
    }

    public async Task<WatchPartyRoomStateDto>
        CreateRoom(
            string hostSessionId,
            string hostName,
            Guid? initialVideoId)
    {
        try
        {
            var room =
                await _watchPartyService
                    .CreateRoomAsync(
                        hostSessionId,
                        hostName,
                        initialVideoId,
                        Context.ConnectionAborted);

            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                GetGroupName(
                    room.RoomCode),
                Context.ConnectionAborted);

            return room;
        }
        catch (Exception exception)
        {
            throw CreateHubException(
                exception);
        }
    }

    public async Task<WatchPartyRoomStateDto>
        JoinRoom(
            string roomCode,
            string sessionId,
            string userName)
    {
        try
        {
            var room =
                _watchPartyService
                    .JoinRoom(
                        roomCode,
                        sessionId,
                        userName);

            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                GetGroupName(
                    room.RoomCode),
                Context.ConnectionAborted);

            await Clients
                .Group(
                    GetGroupName(
                        room.RoomCode))
                .SendAsync(
                    "ParticipantsChanged",
                    room.Participants,
                    Context.ConnectionAborted);

            return room;
        }
        catch (Exception exception)
        {
            throw CreateHubException(
                exception);
        }
    }

    public WatchPartyRoomStateDto
        GetRoomState(
            string roomCode)
    {
        try
        {
            return _watchPartyService
                .GetRoomState(
                    roomCode);
        }
        catch (Exception exception)
        {
            throw CreateHubException(
                exception);
        }
    }

    public async Task LeaveRoom(
        string roomCode,
        string sessionId)
    {
        try
        {
            var result =
                _watchPartyService
                    .LeaveRoom(
                        roomCode,
                        sessionId);

            var groupName =
                GetGroupName(
                    roomCode);

            if (result.RoomClosed)
            {
                await Clients
                    .Group(
                        groupName)
                    .SendAsync(
                        "RoomClosed",
                        roomCode,
                        Context.ConnectionAborted);
            }
            else if (
                result.Room is not null)
            {
                await Clients
                    .Group(
                        groupName)
                    .SendAsync(
                        "ParticipantsChanged",
                        result.Room.Participants,
                        Context.ConnectionAborted);
            }

            await Groups
                .RemoveFromGroupAsync(
                    Context.ConnectionId,
                    groupName,
                    Context.ConnectionAborted);
        }
        catch (Exception exception)
        {
            throw CreateHubException(
                exception);
        }
    }

    public async Task CloseRoom(
        string roomCode,
        string hostSessionId)
    {
        try
        {
            _watchPartyService
                .CloseRoom(
                    roomCode,
                    hostSessionId);

            await Clients
                .Group(
                    GetGroupName(
                        roomCode))
                .SendAsync(
                    "RoomClosed",
                    roomCode,
                    Context.ConnectionAborted);
        }
        catch (Exception exception)
        {
            throw CreateHubException(
                exception);
        }
    }

    public async Task<WatchPartyPlaybackDto>
        SetVideo(
            string roomCode,
            string hostSessionId,
            Guid videoId)
    {
        try
        {
            var playback =
                await _watchPartyService
                    .SetVideoAsync(
                        roomCode,
                        hostSessionId,
                        videoId,
                        Context.ConnectionAborted);

            await Clients
                .Group(
                    GetGroupName(
                        playback.RoomCode))
                .SendAsync(
                    "VideoChanged",
                    playback,
                    Context.ConnectionAborted);

            return playback;
        }
        catch (Exception exception)
        {
            throw CreateHubException(
                exception);
        }
    }

    public async Task<WatchPartyPlaybackDto>
        SetPlaybackState(
            string roomCode,
            string hostSessionId,
            double currentTime,
            bool isPlaying)
    {
        try
        {
            var playback =
                _watchPartyService
                    .SetPlaybackState(
                        roomCode,
                        hostSessionId,
                        currentTime,
                        isPlaying);

            await Clients
                .Group(
                    GetGroupName(
                        playback.RoomCode))
                .SendAsync(
                    "PlaybackChanged",
                    playback,
                    Context.ConnectionAborted);

            return playback;
        }
        catch (Exception exception)
        {
            throw CreateHubException(
                exception);
        }
    }

    public async Task<WatchPartyMessageDto>
        SendMessage(
            string roomCode,
            string sessionId,
            string message)
    {
        try
        {
            var chatMessage =
                _watchPartyService
                    .AddMessage(
                        roomCode,
                        sessionId,
                        message);

            await Clients
                .Group(
                    GetGroupName(
                        chatMessage.RoomCode))
                .SendAsync(
                    "ReceiveWatchPartyMessage",
                    chatMessage,
                    Context.ConnectionAborted);

            return chatMessage;
        }
        catch (Exception exception)
        {
            throw CreateHubException(
                exception);
        }
    }

    private static string GetGroupName(
        string roomCode)
    {
        return
            $"watchparty:{roomCode.Trim().ToUpperInvariant()}";
    }

    private static HubException
        CreateHubException(
            Exception exception)
    {
        return new HubException(
            exception.Message);
    }
}