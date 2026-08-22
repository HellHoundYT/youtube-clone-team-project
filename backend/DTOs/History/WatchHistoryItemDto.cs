using YouTubeClone.Api.DTOs.Videos;

namespace YouTubeClone.Api.DTOs.History;

public sealed class WatchHistoryItemDto
{
    public Guid VideoId { get; init; }

    public int ProgressSeconds { get; init; }

    public bool Completed { get; init; }

    public DateTimeOffset LastWatchedAt { get; init; }

    public VideoListItemDto Video { get; init; } =
        new();
}