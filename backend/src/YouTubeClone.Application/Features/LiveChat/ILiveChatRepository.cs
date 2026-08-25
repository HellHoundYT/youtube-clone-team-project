using YouTubeClone.Domain.LiveChat;

namespace YouTubeClone.Application.Features.LiveChat;

public interface ILiveChatRepository
{
    IReadOnlyList<LiveChatMessage> GetSnapshot(
        Guid streamId);

    LiveChatMessage Add(
        LiveChatMessage message);

    bool TryUpdate<TResult>(
        Guid streamId,
        Guid messageId,
        Func<LiveChatMessage, TResult> update,
        out TResult result);

    bool TryRemoveCascade(
        Guid streamId,
        Guid messageId,
        string expectedSessionId,
        out IReadOnlyList<Guid> removedMessageIds);
}