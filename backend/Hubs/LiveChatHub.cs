using Microsoft.AspNetCore.SignalR;
using YouTubeClone.Api.DTOs.LiveChat;
using YouTubeClone.Api.Services.Streams;

namespace YouTubeClone.Api.Hubs;

public sealed class LiveChatHub :
    Hub
{
    private const int MaxUserNameLength =
        40;

    private const int MaxMessageLength =
        500;

    private readonly ILiveStreamService
        _liveStreamService;

    public LiveChatHub(
        ILiveStreamService liveStreamService)
    {
        _liveStreamService =
            liveStreamService;
    }

    public async Task JoinStream(
        Guid streamId)
    {
        await EnsureStreamExistsAsync(
            streamId);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GetGroupName(streamId),
            Context.ConnectionAborted);
    }

    public async Task LeaveStream(
        Guid streamId)
    {
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GetGroupName(streamId),
            Context.ConnectionAborted);
    }

    public async Task SendMessage(
        Guid streamId,
        string userName,
        string message)
    {
        await EnsureStreamExistsAsync(
            streamId);

        var normalizedUserName =
            userName?.Trim() ??
            string.Empty;

        var normalizedMessage =
            message?.Trim() ??
            string.Empty;

        if (string.IsNullOrWhiteSpace(
                normalizedUserName))
        {
            throw new HubException(
                "User name is required.");
        }

        if (normalizedUserName.Length >
            MaxUserNameLength)
        {
            throw new HubException(
                $"User name must not exceed {MaxUserNameLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(
                normalizedMessage))
        {
            throw new HubException(
                "Message is required.");
        }

        if (normalizedMessage.Length >
            MaxMessageLength)
        {
            throw new HubException(
                $"Message must not exceed {MaxMessageLength} characters.");
        }

        var chatMessage =
            new LiveChatMessageDto
            {
                Id =
                    Guid.NewGuid(),

                StreamId =
                    streamId,

                UserId =
                    null,

                UserName =
                    normalizedUserName,

                Message =
                    normalizedMessage,

                SentAt =
                    DateTimeOffset.UtcNow
            };

        await Clients
            .Group(
                GetGroupName(
                    streamId))
            .SendAsync(
                "ReceiveMessage",
                chatMessage,
                Context.ConnectionAborted);
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

    private static string GetGroupName(
        Guid streamId)
    {
        return
            $"live-stream:{streamId:N}";
    }
}