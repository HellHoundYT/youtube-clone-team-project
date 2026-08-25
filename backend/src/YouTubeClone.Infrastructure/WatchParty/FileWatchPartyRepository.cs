using System.Collections.Concurrent;
using System.Text.Json;
using YouTubeClone.Application.Features.WatchParty;
using YouTubeClone.Domain.WatchParty;

namespace YouTubeClone.Infrastructure.WatchParty;

public sealed class FileWatchPartyRepository :
    IWatchPartyRepository
{
    private sealed class StoredRoom
    {
        public object SyncRoot { get; } =
            new();

        public WatchPartyRoom Room { get; init; } =
            new();
    }

    private sealed class RoomDocument
    {
        public Guid RoomId { get; set; }

        public string RoomCode { get; set; } =
            string.Empty;

        public string HostSessionId { get; set; } =
            string.Empty;

        public Guid? CurrentVideoId { get; set; }

        public double CurrentTime { get; set; }

        public bool IsPlaying { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }

        public List<ParticipantDocument>
            Participants { get; set; } =
                new();

        public List<MessageDocument>
            Messages { get; set; } =
                new();
    }

    private sealed class ParticipantDocument
    {
        public string SessionId { get; set; } =
            string.Empty;

        public Guid? UserId { get; set; }

        public string UserName { get; set; } =
            string.Empty;

        public bool IsHost { get; set; }

        public DateTimeOffset JoinedAt { get; set; }
    }

    private sealed class MessageDocument
    {
        public Guid Id { get; set; }

        public string RoomCode { get; set; } =
            string.Empty;

        public string SessionId { get; set; } =
            string.Empty;

        public Guid? UserId { get; set; }

        public string UserName { get; set; } =
            string.Empty;

        public string Message { get; set; } =
            string.Empty;

        public DateTimeOffset SentAt { get; set; }
    }

    private static readonly JsonSerializerOptions
        JsonOptions =
            new()
            {
                WriteIndented =
                    false
            };

    private readonly ConcurrentDictionary<
        string,
        StoredRoom> _rooms =
            new(
                StringComparer.OrdinalIgnoreCase);

    private readonly object _persistenceLock =
        new();

    private readonly string _filePath;

    public FileWatchPartyRepository()
        : this(
            GetDefaultFilePath())
    {
    }

    public FileWatchPartyRepository(
        string filePath)
    {
        if (string.IsNullOrWhiteSpace(
                filePath))
        {
            throw new ArgumentException(
                "A persistence file path is required.",
                nameof(filePath));
        }

        _filePath =
            Path.GetFullPath(
                filePath);

        Load();
    }

    public bool TryAdd(
        WatchPartyRoom room)
    {
        var added =
            _rooms.TryAdd(
                room.RoomCode,
                new StoredRoom
                {
                    Room =
                        CreateSnapshot(
                            room)
                });

        if (!added)
        {
            return false;
        }

        try
        {
            Persist();

            return true;
        }
        catch
        {
            _rooms.TryRemove(
                room.RoomCode,
                out _);

            throw;
        }
    }

    public WatchPartyRoom?
        GetSnapshot(
            string roomCode)
    {
        if (!_rooms.TryGetValue(
                roomCode,
                out var storedRoom))
        {
            return null;
        }

        lock (storedRoom.SyncRoot)
        {
            return CreateSnapshot(
                storedRoom.Room);
        }
    }

    public bool TryUpdate<TResult>(
        string roomCode,
        Guid? expectedRoomId,
        Func<WatchPartyRoom, TResult> update,
        out TResult result)
    {
        if (!_rooms.TryGetValue(
                roomCode,
                out var storedRoom))
        {
            result =
                default!;

            return false;
        }

        lock (storedRoom.SyncRoot)
        {
            if (expectedRoomId.HasValue &&
                storedRoom.Room.RoomId !=
                expectedRoomId.Value)
            {
                result =
                    default!;

                return false;
            }

            result =
                update(
                    storedRoom.Room);
        }

        Persist();

        return true;
    }

    public bool TryRemove(
        string roomCode,
        Guid expectedRoomId)
    {
        if (!_rooms.TryGetValue(
                roomCode,
                out var storedRoom))
        {
            return false;
        }

        var removed =
            false;

        lock (storedRoom.SyncRoot)
        {
            if (storedRoom.Room.RoomId !=
                expectedRoomId)
            {
                return false;
            }

            if (!_rooms.TryGetValue(
                    roomCode,
                    out var currentRoom) ||
                !ReferenceEquals(
                    currentRoom,
                    storedRoom))
            {
                return false;
            }

            removed =
                _rooms.TryRemove(
                    roomCode,
                    out _);
        }

        if (removed)
        {
            Persist();
        }

        return removed;
    }

    private void Load()
    {
        if (!File.Exists(
                _filePath))
        {
            return;
        }

        try
        {
            var json =
                File.ReadAllText(
                    _filePath);

            var documents =
                JsonSerializer.Deserialize<
                    List<RoomDocument>>(
                        json,
                        JsonOptions);

            if (documents is null)
            {
                return;
            }

            foreach (var document in
                     documents)
            {
                if (string.IsNullOrWhiteSpace(
                        document.RoomCode))
                {
                    continue;
                }

                var room =
                    ToDomain(
                        document);

                _rooms[
                    room.RoomCode] =
                        new StoredRoom
                        {
                            Room =
                                room
                        };
            }
        }
        catch (
            JsonException)
        {
            // Ignore invalid local state.
        }
        catch (
            IOException)
        {
            // Application can still start
            // without restored rooms.
        }
        catch (
            UnauthorizedAccessException)
        {
            // Application can still start
            // without restored rooms.
        }
    }

    private void Persist()
    {
        lock (_persistenceLock)
        {
            var documents =
                new List<
                    RoomDocument>();

            foreach (var pair in
                     _rooms.ToArray())
            {
                lock (pair.Value.SyncRoot)
                {
                    documents.Add(
                        ToDocument(
                            pair.Value.Room));
                }
            }

            var directory =
                Path.GetDirectoryName(
                    _filePath);

            if (!string.IsNullOrWhiteSpace(
                    directory))
            {
                Directory.CreateDirectory(
                    directory);
            }

            var temporaryPath =
                _filePath +
                ".tmp";

            var json =
                JsonSerializer.Serialize(
                    documents,
                    JsonOptions);

            File.WriteAllText(
                temporaryPath,
                json);

            File.Move(
                temporaryPath,
                _filePath,
                true);
        }
    }

    private static string
        GetDefaultFilePath()
    {
        var baseDirectory =
            Environment.GetFolderPath(
                Environment.SpecialFolder
                    .LocalApplicationData);

        if (string.IsNullOrWhiteSpace(
                baseDirectory))
        {
            baseDirectory =
                AppContext.BaseDirectory;
        }

        return Path.Combine(
            baseDirectory,
            "YouTubeClone",
            "watch-party-rooms.json");
    }

    private static RoomDocument
        ToDocument(
            WatchPartyRoom room)
    {
        return new RoomDocument
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
                room.CurrentTime,

            IsPlaying =
                room.IsPlaying,

            UpdatedAt =
                room.UpdatedAt,

            Participants =
                room.Participants
                    .Values
                    .Select(
                        participant =>
                            new ParticipantDocument
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
                            })
                    .ToList(),

            Messages =
                room.Messages
                    .Select(
                        message =>
                            new MessageDocument
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
                            })
                    .ToList()
        };
    }

    private static WatchPartyRoom
        ToDomain(
            RoomDocument document)
    {
        var room =
            new WatchPartyRoom
            {
                RoomId =
                    document.RoomId,

                RoomCode =
                    document.RoomCode,

                HostSessionId =
                    document.HostSessionId,

                CurrentVideoId =
                    document.CurrentVideoId,

                CurrentTime =
                    document.CurrentTime,

                IsPlaying =
                    document.IsPlaying,

                UpdatedAt =
                    document.UpdatedAt
            };

        foreach (var participant in
                 document.Participants)
        {
            room.Participants[
                participant.SessionId] =
                    new WatchPartyParticipant
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

        foreach (var message in
                 document.Messages)
        {
            room.Messages.Add(
                new WatchPartyMessage
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
                });
        }

        return room;
    }

    private static WatchPartyRoom
        CreateSnapshot(
            WatchPartyRoom source)
    {
        return ToDomain(
            ToDocument(
                source));
    }
}
