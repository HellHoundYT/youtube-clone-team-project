using System.Collections.Concurrent;
using YouTubeClone.Application.Features.LiveChat;
using YouTubeClone.Domain.LiveChat;

namespace YouTubeClone.Infrastructure.LiveChat;

public sealed class InMemoryLiveChatRepository :
    ILiveChatRepository
{
    private const int MaxStoredMessagesPerStream =
        200;

    private sealed class StoredStream
    {
        public object SyncRoot { get; } =
            new();

        public Dictionary<
            Guid,
            LiveChatMessage> Messages { get; } =
                new();
    }

    private readonly ConcurrentDictionary<
        Guid,
        StoredStream> _streams =
            new();

    public IReadOnlyList<LiveChatMessage>
        GetSnapshot(
            Guid streamId)
    {
        if (!_streams.TryGetValue(
                streamId,
                out var storedStream))
        {
            return Array.Empty<LiveChatMessage>();
        }

        lock (storedStream.SyncRoot)
        {
            return storedStream.Messages
                .Values
                .OrderBy(
                    message =>
                        message.SentAt)
                .Select(
                    CreateSnapshot)
                .ToArray();
        }
    }

    public LiveChatMessage
        Add(
            LiveChatMessage message)
    {
        var storedStream =
            _streams.GetOrAdd(
                message.StreamId,
                _ =>
                    new StoredStream());

        lock (storedStream.SyncRoot)
        {
            storedStream.Messages[
                message.Id] =
                    CreateSnapshot(
                        message);

            while (storedStream.Messages.Count >
                   MaxStoredMessagesPerStream)
            {
                var oldest =
                    storedStream.Messages
                        .Values
                        .OrderBy(
                            item =>
                                item.SentAt)
                        .First();

                storedStream.Messages.Remove(
                    oldest.Id);
            }

            return CreateSnapshot(
                storedStream.Messages[
                    message.Id]);
        }
    }

    public bool TryUpdate<TResult>(
        Guid streamId,
        Guid messageId,
        Func<LiveChatMessage, TResult> update,
        out TResult result)
    {
        if (!_streams.TryGetValue(
                streamId,
                out var storedStream))
        {
            result =
                default!;

            return false;
        }

        lock (storedStream.SyncRoot)
        {
            if (!storedStream.Messages.TryGetValue(
                    messageId,
                    out var message))
            {
                result =
                    default!;

                return false;
            }

            result =
                update(
                    message);

            return true;
        }
    }

    public bool TryRemoveCascade(
        Guid streamId,
        Guid messageId,
        string expectedSessionId,
        out IReadOnlyList<Guid> removedMessageIds)
    {
        removedMessageIds =
            Array.Empty<Guid>();

        if (!_streams.TryGetValue(
                streamId,
                out var storedStream))
        {
            return false;
        }

        lock (storedStream.SyncRoot)
        {
            if (!storedStream.Messages.TryGetValue(
                    messageId,
                    out var message))
            {
                return false;
            }

            if (!string.Equals(
                    message.SessionId,
                    expectedSessionId,
                    StringComparison.Ordinal))
            {
                return false;
            }

            var ids =
                new HashSet<Guid>
                {
                    messageId
                };

            var changed =
                true;

            while (changed)
            {
                changed =
                    false;

                foreach (var item in
                         storedStream.Messages.Values)
                {
                    if (!item.ParentMessageId.HasValue ||
                        !ids.Contains(
                            item.ParentMessageId.Value) ||
                        ids.Contains(
                            item.Id))
                    {
                        continue;
                    }

                    ids.Add(
                        item.Id);

                    changed =
                        true;
                }
            }

            foreach (var id in
                     ids)
            {
                storedStream.Messages.Remove(
                    id);
            }

            removedMessageIds =
                ids.ToArray();

            return true;
        }
    }

    private static LiveChatMessage
        CreateSnapshot(
            LiveChatMessage source)
    {
        var snapshot =
            new LiveChatMessage
            {
                Id =
                    source.Id,

                StreamId =
                    source.StreamId,

                SessionId =
                    source.SessionId,

                UserId =
                    source.UserId,

                UserName =
                    source.UserName,

                Message =
                    source.Message,

                ParentMessageId =
                    source.ParentMessageId,

                SentAt =
                    source.SentAt,

                EditedAt =
                    source.EditedAt
            };

        foreach (var reaction in
                 source.ReactionSessions)
        {
            snapshot.ReactionSessions[
                reaction.Key] =
                    new HashSet<string>(
                        reaction.Value,
                        StringComparer.Ordinal);
        }

        return snapshot;
    }
}