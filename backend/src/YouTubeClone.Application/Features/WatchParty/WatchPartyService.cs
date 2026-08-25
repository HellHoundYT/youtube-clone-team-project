using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Features.WatchParty.Contracts;
using YouTubeClone.Domain.WatchParty;

namespace YouTubeClone.Application.Features.WatchParty;

public sealed class WatchPartyService :
    IWatchPartyService
{
    private const int MaxSessionIdLength =
        120;

    private const int MaxUserNameLength =
        40;

    private const int MaxMessageLength =
        500;

    private const int MaxMessages =
        100;

    private const int RoomCodeLength =
        6;

    private readonly IVideoService
        _videoService;

    private readonly IWatchPartyRepository
        _repository;

    private readonly IWatchPartyRoomCodeGenerator
        _roomCodeGenerator;

    public WatchPartyService(
        IVideoService videoService,
        IWatchPartyRepository repository,
        IWatchPartyRoomCodeGenerator roomCodeGenerator)
    {
        _videoService =
            videoService;

        _repository =
            repository;

        _roomCodeGenerator =
            roomCodeGenerator;
    }

    public async Task<WatchPartyRoomStateDto>
        CreateRoomAsync(
            string hostSessionId,
            string hostName,
            Guid? initialVideoId,
            CancellationToken cancellationToken = default)
    {
        var normalizedSessionId =
            NormalizeSessionId(
                hostSessionId);

        var normalizedHostName =
            NormalizeUserName(
                hostName);

        if (initialVideoId.HasValue)
        {
            await EnsureVideoExistsAsync(
                initialVideoId.Value,
                cancellationToken);
        }

        for (
            var attempt = 0;
            attempt < 100;
            attempt++)
        {
            var roomCode =
                _roomCodeGenerator
                    .GenerateRoomCode();

            var now =
                DateTimeOffset.UtcNow;

            var room =
                new WatchPartyRoom
                {
                    RoomId =
                        Guid.NewGuid(),

                    RoomCode =
                        roomCode,

                    HostSessionId =
                        normalizedSessionId,

                    CurrentVideoId =
                        initialVideoId,

                    CurrentTime =
                        0,

                    IsPlaying =
                        false,

                    UpdatedAt =
                        now
                };

            room.Participants[
                normalizedSessionId] =
                    new WatchPartyParticipant
                    {
                        SessionId =
                            normalizedSessionId,

                        UserId =
                            null,

                        UserName =
                            normalizedHostName,

                        IsHost =
                            true,

                        JoinedAt =
                            now
                    };

            if (_repository.TryAdd(
                    room))
            {
                return MapRoom(
                    room);
            }
        }

        throw new InvalidOperationException(
            "Watch Party room could not be created.");
    }

    public WatchPartyRoomStateDto
        JoinRoom(
            string roomCode,
            string sessionId,
            string userName)
    {
        var normalizedRoomCode =
            NormalizeRoomCode(
                roomCode);

        var existingRoom =
            GetRequiredRoomSnapshot(
                normalizedRoomCode);

        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        var normalizedUserName =
            NormalizeUserName(
                userName);

        if (_repository.TryUpdate(
                normalizedRoomCode,
                existingRoom.RoomId,
                room =>
                {
                    if (room.Participants.TryGetValue(
                            normalizedSessionId,
                            out var existingParticipant))
                    {
                        room.Participants[
                            normalizedSessionId] =
                                new WatchPartyParticipant
                                {
                                    SessionId =
                                        normalizedSessionId,

                                    UserId =
                                        existingParticipant.UserId,

                                    UserName =
                                        normalizedUserName,

                                    IsHost =
                                        normalizedSessionId ==
                                        room.HostSessionId,

                                    JoinedAt =
                                        existingParticipant.JoinedAt
                                };
                    }
                    else
                    {
                        room.Participants[
                            normalizedSessionId] =
                                new WatchPartyParticipant
                                {
                                    SessionId =
                                        normalizedSessionId,

                                    UserId =
                                        null,

                                    UserName =
                                        normalizedUserName,

                                    IsHost =
                                        normalizedSessionId ==
                                        room.HostSessionId,

                                    JoinedAt =
                                        DateTimeOffset.UtcNow
                                };
                    }

                    return MapRoom(
                        room);
                },
                out var result))
        {
            return result;
        }

        throw new InvalidOperationException(
            "Watch Party room was not found.");
    }

    public WatchPartyRoomStateDto
        GetRoomState(
            string roomCode)
    {
        var normalizedRoomCode =
            NormalizeRoomCode(
                roomCode);

        var room =
            GetRequiredRoomSnapshot(
                normalizedRoomCode);

        return MapRoom(
            room);
    }

    public WatchPartyLeaveResultDto
        LeaveRoom(
            string roomCode,
            string sessionId)
    {
        var normalizedRoomCode =
            NormalizeRoomCode(
                roomCode);

        var existingRoom =
            GetRequiredRoomSnapshot(
                normalizedRoomCode);

        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        if (!_repository.TryUpdate(
                normalizedRoomCode,
                existingRoom.RoomId,
                room =>
                {
                    if (normalizedSessionId ==
                        room.HostSessionId)
                    {
                        return new LeaveOperationResult(
                            room.RoomId,
                            true,
                            null);
                    }

                    room.Participants.Remove(
                        normalizedSessionId);

                    if (room.Participants.Count ==
                        0)
                    {
                        return new LeaveOperationResult(
                            room.RoomId,
                            true,
                            null);
                    }

                    return new LeaveOperationResult(
                        room.RoomId,
                        false,
                        MapRoom(
                            room));
                },
                out var operation))
        {
            throw new InvalidOperationException(
                "Watch Party room was not found.");
        }

        if (operation.RoomClosed)
        {
            _repository.TryRemove(
                normalizedRoomCode,
                operation.RoomId);
        }

        return new WatchPartyLeaveResultDto
        {
            RoomClosed =
                operation.RoomClosed,

            Room =
                operation.Room
        };
    }

    public void CloseRoom(
        string roomCode,
        string hostSessionId)
    {
        var normalizedRoomCode =
            NormalizeRoomCode(
                roomCode);

        var existingRoom =
            GetRequiredRoomSnapshot(
                normalizedRoomCode);

        var normalizedHostSessionId =
            NormalizeSessionId(
                hostSessionId);

        if (!_repository.TryUpdate(
                normalizedRoomCode,
                existingRoom.RoomId,
                room =>
                {
                    EnsureHost(
                        room,
                        normalizedHostSessionId);

                    return room.RoomId;
                },
                out var roomId))
        {
            throw new InvalidOperationException(
                "Watch Party room was not found.");
        }

        _repository.TryRemove(
            normalizedRoomCode,
            roomId);
    }

    public async Task<WatchPartyPlaybackDto>
        SetVideoAsync(
            string roomCode,
            string hostSessionId,
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        var normalizedRoomCode =
            NormalizeRoomCode(
                roomCode);

        var existingRoom =
            GetRequiredRoomSnapshot(
                normalizedRoomCode);

        var normalizedHostSessionId =
            NormalizeSessionId(
                hostSessionId);

        EnsureHost(
            existingRoom,
            normalizedHostSessionId);

        await EnsureVideoExistsAsync(
            videoId,
            cancellationToken);

        if (_repository.TryUpdate(
                normalizedRoomCode,
                existingRoom.RoomId,
                room =>
                {
                    EnsureHost(
                        room,
                        normalizedHostSessionId);

                    room.CurrentVideoId =
                        videoId;

                    room.CurrentTime =
                        0;

                    room.IsPlaying =
                        false;

                    room.UpdatedAt =
                        DateTimeOffset.UtcNow;

                    return MapPlayback(
                        room);
                },
                out var playback))
        {
            return playback;
        }

        var activeRoom =
            _repository.GetSnapshot(
                normalizedRoomCode);

        if (activeRoom is null)
        {
            throw new InvalidOperationException(
                "Watch Party room was not found.");
        }

        throw new InvalidOperationException(
            "Watch Party room is no longer active.");
    }

    public WatchPartyPlaybackDto
        SetPlaybackState(
            string roomCode,
            string hostSessionId,
            double currentTime,
            bool isPlaying)
    {
        if (!double.IsFinite(
                currentTime) ||
            currentTime < 0)
        {
            throw new ArgumentException(
                "Playback time is invalid.");
        }

        var normalizedRoomCode =
            NormalizeRoomCode(
                roomCode);

        var existingRoom =
            GetRequiredRoomSnapshot(
                normalizedRoomCode);

        var normalizedHostSessionId =
            NormalizeSessionId(
                hostSessionId);

        if (_repository.TryUpdate(
                normalizedRoomCode,
                existingRoom.RoomId,
                room =>
                {
                    EnsureHost(
                        room,
                        normalizedHostSessionId);

                    if (!room.CurrentVideoId.HasValue)
                    {
                        throw new InvalidOperationException(
                            "No video is selected in this room.");
                    }

                    room.CurrentTime =
                        currentTime;

                    room.IsPlaying =
                        isPlaying;

                    room.UpdatedAt =
                        DateTimeOffset.UtcNow;

                    return MapPlayback(
                        room);
                },
                out var playback))
        {
            return playback;
        }

        throw new InvalidOperationException(
            "Watch Party room was not found.");
    }

    public WatchPartyMessageDto
        AddMessage(
            string roomCode,
            string sessionId,
            string message)
    {
        var normalizedRoomCode =
            NormalizeRoomCode(
                roomCode);

        var existingRoom =
            GetRequiredRoomSnapshot(
                normalizedRoomCode);

        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        var normalizedMessage =
            message?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                normalizedMessage))
        {
            throw new ArgumentException(
                "Message is required.");
        }

        if (normalizedMessage.Length >
            MaxMessageLength)
        {
            throw new ArgumentException(
                $"Message must not exceed {MaxMessageLength} characters.");
        }

        if (_repository.TryUpdate(
                normalizedRoomCode,
                existingRoom.RoomId,
                room =>
                {
                    if (!room.Participants.TryGetValue(
                            normalizedSessionId,
                            out var participant))
                    {
                        throw new InvalidOperationException(
                            "Participant is not in this room.");
                    }

                    var chatMessage =
                        new WatchPartyMessage
                        {
                            Id =
                                Guid.NewGuid(),

                            RoomCode =
                                room.RoomCode,

                            SessionId =
                                participant.SessionId,

                            UserId =
                                participant.UserId,

                            UserName =
                                participant.UserName,

                            Message =
                                normalizedMessage,

                            SentAt =
                                DateTimeOffset.UtcNow
                        };

                    if (room.Messages.Count >=
                        MaxMessages)
                    {
                        room.Messages.RemoveAt(
                            0);
                    }

                    room.Messages.Add(
                        chatMessage);

                    return MapMessage(
                        chatMessage);
                },
                out var result))
        {
            return result;
        }

        throw new InvalidOperationException(
            "Watch Party room was not found.");
    }

    private async Task EnsureVideoExistsAsync(
        Guid videoId,
        CancellationToken cancellationToken)
    {
        var video =
            await _videoService
                .GetVideoByIdAsync(
                    videoId,
                    cancellationToken);

        if (video is null)
        {
            throw new InvalidOperationException(
                "Video was not found.");
        }
    }

    private WatchPartyRoom
        GetRequiredRoomSnapshot(
            string normalizedRoomCode)
    {
        var room =
            _repository.GetSnapshot(
                normalizedRoomCode);

        if (room is not null)
        {
            return room;
        }

        throw new InvalidOperationException(
            "Watch Party room was not found.");
    }

    private static void EnsureHost(
        WatchPartyRoom room,
        string sessionId)
    {
        if (room.HostSessionId !=
            sessionId)
        {
            throw new InvalidOperationException(
                "Only the room host can perform this action.");
        }
    }

    private static string NormalizeRoomCode(
        string roomCode)
    {
        var normalizedRoomCode =
            roomCode?.Trim()
                .ToUpperInvariant() ??
            string.Empty;

        if (normalizedRoomCode.Length !=
            RoomCodeLength)
        {
            throw new ArgumentException(
                "Room code is invalid.");
        }

        return normalizedRoomCode;
    }

    private static string NormalizeSessionId(
        string sessionId)
    {
        var normalizedSessionId =
            sessionId?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                normalizedSessionId))
        {
            throw new ArgumentException(
                "Session id is required.");
        }

        if (normalizedSessionId.Length >
            MaxSessionIdLength)
        {
            throw new ArgumentException(
                $"Session id must not exceed {MaxSessionIdLength} characters.");
        }

        return normalizedSessionId;
    }

    private static string NormalizeUserName(
        string userName)
    {
        var normalizedUserName =
            userName?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                normalizedUserName))
        {
            throw new ArgumentException(
                "User name is required.");
        }

        if (normalizedUserName.Length >
            MaxUserNameLength)
        {
            throw new ArgumentException(
                $"User name must not exceed {MaxUserNameLength} characters.");
        }

        return normalizedUserName;
    }

    private static double GetEffectiveCurrentTime(
        WatchPartyRoom room)
    {
        if (!room.IsPlaying)
        {
            return room.CurrentTime;
        }

        var elapsed =
            DateTimeOffset.UtcNow -
            room.UpdatedAt;

        return Math.Max(
            0,
            room.CurrentTime +
            elapsed.TotalSeconds);
    }

    private static WatchPartyRoomStateDto
        MapRoom(
            WatchPartyRoom room)
    {
        return new WatchPartyRoomStateDto
        {
            RoomId =
                room.RoomId,

            RoomCode =
                room.RoomCode,

            HostSessionId =
                room.HostSessionId,

            CurrentVideoId =
                room.CurrentVideoId,

            CurrentTime =
                GetEffectiveCurrentTime(
                    room),

            IsPlaying =
                room.IsPlaying,

            UpdatedAt =
                room.UpdatedAt,

            Participants =
                room.Participants
                    .Values
                    .OrderByDescending(
                        participant =>
                            participant.IsHost)
                    .ThenBy(
                        participant =>
                            participant.JoinedAt)
                    .Select(
                        MapParticipant)
                    .ToArray(),

            Messages =
                room.Messages
                    .Select(
                        MapMessage)
                    .ToArray()
        };
    }

    private static WatchPartyParticipantDto
        MapParticipant(
            WatchPartyParticipant participant)
    {
        return new WatchPartyParticipantDto
        {
            SessionId =
                participant.SessionId,

            UserId =
                participant.UserId,

            UserName =
                participant.UserName,

            IsHost =
                participant.IsHost,

            JoinedAt =
                participant.JoinedAt
        };
    }

    private static WatchPartyMessageDto
        MapMessage(
            WatchPartyMessage message)
    {
        return new WatchPartyMessageDto
        {
            Id =
                message.Id,

            RoomCode =
                message.RoomCode,

            SessionId =
                message.SessionId,

            UserId =
                message.UserId,

            UserName =
                message.UserName,

            Message =
                message.Message,

            SentAt =
                message.SentAt
        };
    }

    private static WatchPartyPlaybackDto
        MapPlayback(
            WatchPartyRoom room)
    {
        return new WatchPartyPlaybackDto
        {
            RoomCode =
                room.RoomCode,

            CurrentVideoId =
                room.CurrentVideoId,

            CurrentTime =
                room.CurrentTime,

            IsPlaying =
                room.IsPlaying,

            UpdatedAt =
                room.UpdatedAt
        };
    }

    private sealed record LeaveOperationResult(
        Guid RoomId,
        bool RoomClosed,
        WatchPartyRoomStateDto? Room);
}