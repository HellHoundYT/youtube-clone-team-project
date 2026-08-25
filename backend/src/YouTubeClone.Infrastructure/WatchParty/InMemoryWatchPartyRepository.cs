using System.Collections.Concurrent;
using YouTubeClone.Application.Features.WatchParty;
using YouTubeClone.Domain.WatchParty;

namespace YouTubeClone.Infrastructure.WatchParty;

public sealed class InMemoryWatchPartyRepository :
    IWatchPartyRepository
{
    private sealed class StoredRoom
    {
        public object SyncRoot { get; } =
            new();

        public WatchPartyRoom Room { get; init; } =
            new();
    }

    private readonly ConcurrentDictionary<
        string,
        StoredRoom> _rooms =
            new(
                StringComparer.OrdinalIgnoreCase);

    public bool TryAdd(
        WatchPartyRoom room)
    {
        return _rooms.TryAdd(
            room.RoomCode,
            new StoredRoom
            {
                Room =
                    CreateSnapshot(
                        room)
            });
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

            return true;
        }
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

            return _rooms.TryRemove(
                roomCode,
                out _);
        }
    }

    private static WatchPartyRoom
        CreateSnapshot(
            WatchPartyRoom source)
    {
        var snapshot =
            new WatchPartyRoom
            {
                RoomId =
                    source.RoomId,

                RoomCode =
                    source.RoomCode,

                HostSessionId =
                    source.HostSessionId,

                CurrentVideoId =
                    source.CurrentVideoId,

                CurrentTime =
                    source.CurrentTime,

                IsPlaying =
                    source.IsPlaying,

                UpdatedAt =
                    source.UpdatedAt
            };

        foreach (var participant in
                 source.Participants.Values)
        {
            snapshot.Participants[
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
                 source.Messages)
        {
            snapshot.Messages.Add(
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

        return snapshot;
    }
}