namespace YouTubeClone.Api.DTOs.LiveChat;

public sealed class LiveChatMessageDto
{
    public Guid Id { get; init; }

    public Guid StreamId { get; init; }

    public Guid? UserId { get; init; }

    public string UserName { get; init; } =
        string.Empty;

    public string Message { get; init; } =
        string.Empty;

    public DateTimeOffset SentAt { get; init; }
}