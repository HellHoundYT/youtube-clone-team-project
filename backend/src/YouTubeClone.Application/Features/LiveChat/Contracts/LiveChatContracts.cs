namespace YouTubeClone.Application.Features.LiveChat.Contracts;

public sealed record LiveChatReactionDto(
    string Emoji,
    int Count,
    bool? ReactedByCurrentSession);

public sealed record LiveChatMessageDto(
    Guid Id,
    Guid StreamId,
    Guid? UserId,
    string UserName,
    string Message,
    Guid? ParentMessageId,
    DateTimeOffset SentAt,
    DateTimeOffset? EditedAt,
    bool IsOwn,
    IReadOnlyList<LiveChatReactionDto> Reactions);

public sealed record LiveChatReactionUpdateDto(
    Guid MessageId,
    string Emoji,
    int Count,
    bool? ReactedByCurrentSession);

public sealed record LiveChatDeleteResultDto(
    IReadOnlyList<Guid> MessageIds);