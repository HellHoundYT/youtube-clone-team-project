using YouTubeClone.Application.Features.LiveChat.Contracts;
using YouTubeClone.Domain.LiveChat;

namespace YouTubeClone.Application.Features.LiveChat;

public sealed class LiveChatService :
    ILiveChatService
{
    private const int MaxSessionIdLength =
        120;

    private const int MaxUserNameLength =
        40;

    private const int MaxMessageLength =
        500;

    private static readonly HashSet<string>
        AllowedReactions =
            new(
                new[]
                {
                    "\u2764\uFE0F",
                    "\U0001F44D",
                    "\U0001F602",
                    "\U0001F62E",
                    "\U0001F622",
                    "\U0001F525"
                },
                StringComparer.Ordinal);

    private readonly ILiveChatRepository
        _repository;

    public LiveChatService(
        ILiveChatRepository repository)
    {
        _repository =
            repository;
    }

    public IReadOnlyList<LiveChatMessageDto>
        GetSnapshot(
            Guid streamId,
            string sessionId)
    {
        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        return _repository
            .GetSnapshot(
                streamId)
            .Select(
                message =>
                    MapMessage(
                        message,
                        normalizedSessionId))
            .ToArray();
    }

    public LiveChatMessageDto
        SendMessage(
            Guid streamId,
            string sessionId,
            string userName,
            string message)
    {
        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        var normalizedUserName =
            NormalizeUserName(
                userName);

        var normalizedMessage =
            NormalizeMessage(
                message);

        var entity =
            new LiveChatMessage
            {
                Id =
                    Guid.NewGuid(),

                StreamId =
                    streamId,

                SessionId =
                    normalizedSessionId,

                UserId =
                    null,

                UserName =
                    normalizedUserName,

                Message =
                    normalizedMessage,

                ParentMessageId =
                    null,

                SentAt =
                    DateTimeOffset.UtcNow
            };

        var stored =
            _repository.Add(
                entity);

        return MapMessage(
            stored,
            normalizedSessionId);
    }

    public LiveChatMessageDto
        EditMessage(
            Guid streamId,
            string sessionId,
            Guid messageId,
            string message)
    {
        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        var normalizedMessage =
            NormalizeMessage(
                message);

        if (!_repository.TryUpdate(
                streamId,
                messageId,
                stored =>
                {
                    if (!string.Equals(
                            stored.SessionId,
                            normalizedSessionId,
                            StringComparison.Ordinal))
                    {
                        return new EditOperation(
                            false,
                            null);
                    }

                    stored.Message =
                        normalizedMessage;

                    stored.EditedAt =
                        DateTimeOffset.UtcNow;

                    return new EditOperation(
                        true,
                        MapMessage(
                            stored,
                            normalizedSessionId));
                },
                out var operation))
        {
            throw new InvalidOperationException(
                "Live chat message was not found.");
        }

        if (!operation.Allowed ||
            operation.Message is null)
        {
            throw new InvalidOperationException(
                "Only the message owner can edit it.");
        }

        return operation.Message;
    }

    public LiveChatDeleteResultDto
        DeleteMessage(
            Guid streamId,
            string sessionId,
            Guid messageId)
    {
        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        if (!_repository.TryRemoveCascade(
                streamId,
                messageId,
                normalizedSessionId,
                out var removedMessageIds))
        {
            throw new InvalidOperationException(
                "Message was not found or does not belong to this session.");
        }

        return new LiveChatDeleteResultDto(
            removedMessageIds);
    }

    public LiveChatMessageDto
        ReplyToMessage(
            Guid streamId,
            string sessionId,
            string userName,
            Guid parentMessageId,
            string message)
    {
        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        var normalizedUserName =
            NormalizeUserName(
                userName);

        var normalizedMessage =
            NormalizeMessage(
                message);

        var parentExists =
            _repository
                .GetSnapshot(
                    streamId)
                .Any(
                    item =>
                        item.Id ==
                        parentMessageId);

        if (!parentExists)
        {
            throw new InvalidOperationException(
                "Parent live chat message was not found.");
        }

        var entity =
            new LiveChatMessage
            {
                Id =
                    Guid.NewGuid(),

                StreamId =
                    streamId,

                SessionId =
                    normalizedSessionId,

                UserId =
                    null,

                UserName =
                    normalizedUserName,

                Message =
                    normalizedMessage,

                ParentMessageId =
                    parentMessageId,

                SentAt =
                    DateTimeOffset.UtcNow
            };

        var stored =
            _repository.Add(
                entity);

        return MapMessage(
            stored,
            normalizedSessionId);
    }

    public LiveChatReactionUpdateDto
        ToggleReaction(
            Guid streamId,
            string sessionId,
            Guid messageId,
            string emoji)
    {
        var normalizedSessionId =
            NormalizeSessionId(
                sessionId);

        var normalizedEmoji =
            emoji?.Trim() ??
            string.Empty;

        if (!AllowedReactions.Contains(
                normalizedEmoji))
        {
            throw new InvalidOperationException(
                "Unsupported live chat reaction.");
        }

        if (!_repository.TryUpdate(
                streamId,
                messageId,
                stored =>
                {
                    if (!stored.ReactionSessions.TryGetValue(
                            normalizedEmoji,
                            out var sessions))
                    {
                        sessions =
                            new HashSet<string>(
                                StringComparer.Ordinal);

                        stored.ReactionSessions[
                            normalizedEmoji] =
                                sessions;
                    }

                    var reacted =
                        sessions.Add(
                            normalizedSessionId);

                    if (!reacted)
                    {
                        sessions.Remove(
                            normalizedSessionId);
                    }

                    var count =
                        sessions.Count;

                    if (count == 0)
                    {
                        stored.ReactionSessions.Remove(
                            normalizedEmoji);
                    }

                    return new LiveChatReactionUpdateDto(
                        messageId,
                        normalizedEmoji,
                        count,
                        reacted);
                },
                out var result))
        {
            throw new InvalidOperationException(
                "Live chat message was not found.");
        }

        return result;
    }

    private static LiveChatMessageDto
        MapMessage(
            LiveChatMessage message,
            string currentSessionId)
    {
        var reactions =
            message.ReactionSessions
                .OrderBy(
                    pair =>
                        pair.Key,
                    StringComparer.Ordinal)
                .Select(
                    pair =>
                        new LiveChatReactionDto(
                            pair.Key,
                            pair.Value.Count,
                            pair.Value.Contains(
                                currentSessionId)))
                .ToArray();

        return new LiveChatMessageDto(
            message.Id,
            message.StreamId,
            message.UserId,
            message.UserName,
            message.Message,
            message.ParentMessageId,
            message.SentAt,
            message.EditedAt,
            string.Equals(
                message.SessionId,
                currentSessionId,
                StringComparison.Ordinal),
            reactions);
    }

    private static string
        NormalizeSessionId(
            string sessionId)
    {
        var normalized =
            sessionId?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                normalized))
        {
            throw new InvalidOperationException(
                "Session id is required.");
        }

        if (normalized.Length >
            MaxSessionIdLength)
        {
            throw new InvalidOperationException(
                $"Session id must not exceed {MaxSessionIdLength} characters.");
        }

        return normalized;
    }

    private static string
        NormalizeUserName(
            string userName)
    {
        var normalized =
            userName?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                normalized))
        {
            throw new InvalidOperationException(
                "User name is required.");
        }

        if (normalized.Length >
            MaxUserNameLength)
        {
            throw new InvalidOperationException(
                $"User name must not exceed {MaxUserNameLength} characters.");
        }

        return normalized;
    }

    private static string
        NormalizeMessage(
            string message)
    {
        var normalized =
            message?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                normalized))
        {
            throw new InvalidOperationException(
                "Message is required.");
        }

        if (normalized.Length >
            MaxMessageLength)
        {
            throw new InvalidOperationException(
                $"Message must not exceed {MaxMessageLength} characters.");
        }

        return normalized;
    }

    private sealed record EditOperation(
        bool Allowed,
        LiveChatMessageDto? Message);
}