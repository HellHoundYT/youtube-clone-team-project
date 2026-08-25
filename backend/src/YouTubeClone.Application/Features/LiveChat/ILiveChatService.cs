using YouTubeClone.Application.Features.LiveChat.Contracts;

namespace YouTubeClone.Application.Features.LiveChat;

public interface ILiveChatService
{
    IReadOnlyList<LiveChatMessageDto> GetSnapshot(
        Guid streamId,
        string sessionId);

    LiveChatMessageDto SendMessage(
        Guid streamId,
        string sessionId,
        string userName,
        string message);

    LiveChatMessageDto EditMessage(
        Guid streamId,
        string sessionId,
        Guid messageId,
        string message);

    LiveChatDeleteResultDto DeleteMessage(
        Guid streamId,
        string sessionId,
        Guid messageId);

    LiveChatMessageDto ReplyToMessage(
        Guid streamId,
        string sessionId,
        string userName,
        Guid parentMessageId,
        string message);

    LiveChatReactionUpdateDto ToggleReaction(
        Guid streamId,
        string sessionId,
        Guid messageId,
        string emoji);
}