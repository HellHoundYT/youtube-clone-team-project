using Microsoft.AspNetCore.SignalR;
using YouTubeClone.Application.Features.LiveChat;
using YouTubeClone.Application.Features.LiveChat.Contracts;
using YouTubeClone.Application.Features.Streams;

namespace YouTubeClone.Api.Hubs;

public sealed class LiveChatHub :
    Hub
{
    private readonly ILiveStreamService
        _liveStreamService;

    private readonly ILiveChatService
        _liveChatService;

    public LiveChatHub(
        ILiveStreamService liveStreamService,
        ILiveChatService liveChatService)
    {
        _liveStreamService =
            liveStreamService;

        _liveChatService =
            liveChatService;
    }

    public async Task<
        IReadOnlyList<LiveChatMessageDto>>
        JoinStream(
            Guid streamId,
            string sessionId)
    {
        await EnsureStreamExistsAsync(
            streamId);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GetGroupName(
                streamId),
            Context.ConnectionAborted);

        return Execute(
            () =>
                _liveChatService.GetSnapshot(
                    streamId,
                    sessionId));
    }

    public async Task LeaveStream(
        Guid streamId)
    {
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GetGroupName(
                streamId),
            Context.ConnectionAborted);
    }

    public async Task<LiveChatMessageDto>
        SendMessage(
            Guid streamId,
            string sessionId,
            string userName,
            string message)
    {
        await EnsureStreamExistsAsync(
            streamId);

        var result =
            Execute(
                () =>
                    _liveChatService.SendMessage(
                        streamId,
                        sessionId,
                        userName,
                        message));

        await Clients
            .OthersInGroup(
                GetGroupName(
                    streamId))
            .SendAsync(
                "MessageAdded",
                ToPublic(
                    result),
                Context.ConnectionAborted);

        return result;
    }

    public async Task<LiveChatMessageDto>
        EditMessage(
            Guid streamId,
            string sessionId,
            Guid messageId,
            string message)
    {
        await EnsureStreamExistsAsync(
            streamId);

        var result =
            Execute(
                () =>
                    _liveChatService.EditMessage(
                        streamId,
                        sessionId,
                        messageId,
                        message));

        await Clients
            .OthersInGroup(
                GetGroupName(
                    streamId))
            .SendAsync(
                "MessageUpdated",
                ToPublic(
                    result),
                Context.ConnectionAborted);

        return result;
    }

    public async Task<LiveChatDeleteResultDto>
        DeleteMessage(
            Guid streamId,
            string sessionId,
            Guid messageId)
    {
        await EnsureStreamExistsAsync(
            streamId);

        var result =
            Execute(
                () =>
                    _liveChatService.DeleteMessage(
                        streamId,
                        sessionId,
                        messageId));

        await Clients
            .OthersInGroup(
                GetGroupName(
                    streamId))
            .SendAsync(
                "MessagesDeleted",
                result,
                Context.ConnectionAborted);

        return result;
    }

    public async Task<LiveChatMessageDto>
        ReplyToMessage(
            Guid streamId,
            string sessionId,
            string userName,
            Guid parentMessageId,
            string message)
    {
        await EnsureStreamExistsAsync(
            streamId);

        var result =
            Execute(
                () =>
                    _liveChatService.ReplyToMessage(
                        streamId,
                        sessionId,
                        userName,
                        parentMessageId,
                        message));

        await Clients
            .OthersInGroup(
                GetGroupName(
                    streamId))
            .SendAsync(
                "MessageAdded",
                ToPublic(
                    result),
                Context.ConnectionAborted);

        return result;
    }

    public async Task<LiveChatReactionUpdateDto>
        ToggleReaction(
            Guid streamId,
            string sessionId,
            Guid messageId,
            string emoji)
    {
        await EnsureStreamExistsAsync(
            streamId);

        var result =
            Execute(
                () =>
                    _liveChatService.ToggleReaction(
                        streamId,
                        sessionId,
                        messageId,
                        emoji));

        var publicResult =
            result with
            {
                ReactedByCurrentSession =
                    null
            };

        await Clients
            .OthersInGroup(
                GetGroupName(
                    streamId))
            .SendAsync(
                "ReactionUpdated",
                publicResult,
                Context.ConnectionAborted);

        return result;
    }

    private async Task
        EnsureStreamExistsAsync(
            Guid streamId)
    {
        var stream =
            await _liveStreamService
                .GetLiveStreamByIdAsync(
                    streamId,
                    Context.ConnectionAborted);

        if (stream is null)
        {
            throw new HubException(
                "Live stream was not found.");
        }
    }

    private static LiveChatMessageDto
        ToPublic(
            LiveChatMessageDto message)
    {
        var reactions =
            message.Reactions
                .Select(
                    reaction =>
                        reaction with
                        {
                            ReactedByCurrentSession =
                                null
                        })
                .ToArray();

        return message with
        {
            IsOwn =
                false,

            Reactions =
                reactions
        };
    }

    private static TResult
        Execute<TResult>(
            Func<TResult> action)
    {
        try
        {
            return action();
        }
        catch (InvalidOperationException error)
        {
            throw new HubException(
                error.Message);
        }
    }

    private static string GetGroupName(
        Guid streamId)
    {
        return
            $"live-stream:{streamId:N}";
    }
}