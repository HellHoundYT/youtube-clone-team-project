using YouTubeClone.Domain.WatchParty;

namespace YouTubeClone.Application.Features.WatchParty;

public interface IWatchPartyRepository
{
    bool TryAdd(
        WatchPartyRoom room);

    WatchPartyRoom? GetSnapshot(
        string roomCode);

    bool TryUpdate<TResult>(
        string roomCode,
        Guid? expectedRoomId,
        Func<WatchPartyRoom, TResult> update,
        out TResult result);

    bool TryRemove(
        string roomCode,
        Guid expectedRoomId);
}