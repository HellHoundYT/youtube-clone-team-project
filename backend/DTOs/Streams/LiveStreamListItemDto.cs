namespace YouTubeClone.Api.DTOs.Streams;

public sealed class LiveStreamListItemDto
{
    public Guid Id { get; init; }

    public Guid ChannelId { get; init; }

    public string ChannelName { get; init; } =
        string.Empty;

    public string? ChannelAvatarPath { get; init; }

    public string Title { get; init; } =
        string.Empty;

    public string Category { get; init; } =
        string.Empty;

    public string CategorySlug { get; init; } =
        string.Empty;

    public string? ThumbnailPath { get; init; }

    public int ViewerCount { get; init; }

    public bool IsLive { get; init; }

    public DateTimeOffset StartedAt { get; init; }
}