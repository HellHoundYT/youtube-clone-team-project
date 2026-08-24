using System.Collections.Concurrent;
using System.Security.Cryptography;
using YouTubeClone.Api.DTOs.WatchParty;
using YouTubeClone.Api.Services.Videos;

namespace YouTubeClone.Api.Services.WatchParty;

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

    private const string RoomCodeAlphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private readonly ConcurrentDictionary<
        string,
        WatchPartyRoom>
        _rooms =
            new(
                StringComparer.OrdinalIgnoreCase);

    private readonly IVideoService
        _videoService;

    public WatchPartyService(
        IVideoService videoService)
    {
        _videoService =
            videoService;
    }

    public async Task<WatchPartyRoomStateDto>
        CreateRoomAsync(
            string hostSessionId,
            string hostName,
            Guid? initialVideoId,
            CancellationToken cancellationToken =
                default)
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
                GenerateRoomCode();

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
                    new WatchPartyParticipantDto
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

            if (
                _rooms.TryAdd(
                    roomCode,
                    room))
            {
                lock (room.SyncRoot)
                {
                    return MapRoom(
                        room);
                }
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
        var room =
            GetRequiredRoom(
                roomCode);

        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        var normalizedUserName =
            NormalizeUserName(
                userName);

        lock (room.SyncRoot)
        {
            if (
                room.Participants.TryGetValue(
                    normalizedSessionId,
                    out var existingParticipant))
            {
                room.Participants[
                    normalizedSessionId] =
                        new WatchPartyParticipantDto
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
                        new WatchPartyParticipantDto
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
        }
    }

    public WatchPartyRoomStateDto
        GetRoomState(
            string roomCode)
    {
        var room =
            GetRequiredRoom(
                roomCode);

        lock (room.SyncRoot)
        {
            return MapRoom(
                room);
        }
    }

    public WatchPartyLeaveResultDto
        LeaveRoom(
            string roomCode,
            string sessionId)
    {
        var room =
            GetRequiredRoom(
                roomCode);

        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        lock (room.SyncRoot)
        {
            if (
                normalizedSessionId ==
                room.HostSessionId)
            {
                _rooms.TryRemove(
                    room.RoomCode,
                    out _);

                return new WatchPartyLeaveResultDto
                {
                    RoomClosed =
                        true,

                    Room =
                        null
                };
            }

            room.Participants.Remove(
                normalizedSessionId);

            if (
                room.Participants.Count ==
                0)
            {
                _rooms.TryRemove(
                    room.RoomCode,
                    out _);

                return new WatchPartyLeaveResultDto
                {
                    RoomClosed =
                        true,

                    Room =
                        null
                };
            }

            return new WatchPartyLeaveResultDto
            {
                RoomClosed =
                    false,

                Room =
                    MapRoom(
                        room)
            };
        }
    }

    public void CloseRoom(
        string roomCode,
        string hostSessionId)
    {
        var room =
            GetRequiredRoom(
                roomCode);

        var normalizedHostSessionId =
            NormalizeSessionId(
                hostSessionId);

        lock (room.SyncRoot)
        {
            EnsureHost(
                room,
                normalizedHostSessionId);

            _rooms.TryRemove(
                room.RoomCode,
                out _);
        }
    }

    public async Task<WatchPartyPlaybackDto>
        SetVideoAsync(
            string roomCode,
            string hostSessionId,
            Guid videoId,
            CancellationToken cancellationToken =
                default)
    {
        var room =
            GetRequiredRoom(
                roomCode);

        var normalizedHostSessionId =
            NormalizeSessionId(
                hostSessionId);

        lock (room.SyncRoot)
        {
            EnsureHost(
                room,
                normalizedHostSessionId);
        }

        await EnsureVideoExistsAsync(
            videoId,
            cancellationToken);

        var activeRoom =
            GetRequiredRoom(
                room.RoomCode);

        if (
            !ReferenceEquals(
                room,
                activeRoom))
        {
            throw new InvalidOperationException(
                "Watch Party room is no longer active.");
        }

        lock (room.SyncRoot)
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
        }
    }

    public WatchPartyPlaybackDto
        SetPlaybackState(
            string roomCode,
            string hostSessionId,
            double currentTime,
            bool isPlaying)
    {
        if (
            !double.IsFinite(
                currentTime) ||
            currentTime < 0)
        {
            throw new ArgumentException(
                "Playback time is invalid.");
        }

        var room =
            GetRequiredRoom(
                roomCode);

        var normalizedHostSessionId =
            NormalizeSessionId(
                hostSessionId);

        lock (room.SyncRoot)
        {
            EnsureHost(
                room,
                normalizedHostSessionId);

            if (
                !room.CurrentVideoId.HasValue)
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
        }
    }

    public WatchPartyMessageDto
        AddMessage(
            string roomCode,
            string sessionId,
            string message)
    {
        var room =
            GetRequiredRoom(
                roomCode);

        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        var normalizedMessage =
            message?.Trim() ??
            string.Empty;

        if (
            string.IsNullOrWhiteSpace(
                normalizedMessage))
        {
            throw new ArgumentException(
                "Message is required.");
        }

        if (
            normalizedMessage.Length >
            MaxMessageLength)
        {
            throw new ArgumentException(
                $"Message must not exceed {MaxMessageLength} characters.");
        }

        lock (room.SyncRoot)
        {
            if (
                !room.Participants.TryGetValue(
                    normalizedSessionId,
                    out var participant))
            {
                throw new InvalidOperationException(
                    "Participant is not in this room.");
            }

            var chatMessage =
                new WatchPartyMessageDto
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

            if (
                room.Messages.Count >=
                MaxMessages)
            {
                room.Messages.RemoveAt(
                    0);
            }

            room.Messages.Add(
                chatMessage);

            return chatMessage;
        }
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

    private WatchPartyRoom GetRequiredRoom(
        string roomCode)
    {
        var normalizedRoomCode =
            NormalizeRoomCode(
                roomCode);

        if (
            _rooms.TryGetValue(
                normalizedRoomCode,
                out var room))
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
        if (
            room.HostSessionId !=
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

        if (
            normalizedRoomCode.Length !=
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

        if (
            string.IsNullOrWhiteSpace(
                normalizedSessionId))
        {
            throw new ArgumentException(
                "Session id is required.");
        }

        if (
            normalizedSessionId.Length >
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

        if (
            string.IsNullOrWhiteSpace(
                normalizedUserName))
        {
            throw new ArgumentException(
                "User name is required.");
        }

        if (
            normalizedUserName.Length >
            MaxUserNameLength)
        {
            throw new ArgumentException(
                $"User name must not exceed {MaxUserNameLength} characters.");
        }

        return normalizedUserName;
    }

    private static string GenerateRoomCode()
    {
        var characters =
            new char[
                RoomCodeLength];

        for (
            var index = 0;
            index < characters.Length;
            index++)
        {
            var alphabetIndex =
                RandomNumberGenerator
                    .GetInt32(
                        RoomCodeAlphabet.Length);

            characters[index] =
                RoomCodeAlphabet[
                    alphabetIndex];
        }

        return new string(
            characters);
    }

    private static double
        GetEffectiveCurrentTime(
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
                    .ToArray(),

            Messages =
                room.Messages
                    .ToArray()
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

    private sealed class WatchPartyRoom
    {
        public object SyncRoot { get; } =
            new();

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
            WatchPartyParticipantDto>
            Participants { get; } =
                new(
                    StringComparer.Ordinal);

        public List<WatchPartyMessageDto>
            Messages { get; } =
                new();
    }
}