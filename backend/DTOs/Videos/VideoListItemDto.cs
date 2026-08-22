namespace YouTubeClone.Api.DTOs.Videos;

public sealed class VideoListItemDto
{
    public Guid Id { get; init; }

    public Guid ChannelId { get; init; }

    public string ChannelName { get; init; } = string.Empty;

    public string? ChannelAvatarPath { get; init; }

    public string? Category { get; init; }

    public string? CategorySlug { get; init; }

    public string Title { get; init; } = string.Empty;

    public string? ThumbnailPath { get; init; }

    public int DurationSeconds { get; init; }

    public long ViewCount { get; init; }

    public DateTimeOffset? PublishedAt { get; init; }
}