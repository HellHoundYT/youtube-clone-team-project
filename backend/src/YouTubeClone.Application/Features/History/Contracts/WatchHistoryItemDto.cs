using YouTubeClone.Application.Features.Videos.Contracts;

namespace YouTubeClone.Application.Features.History.Contracts;

public sealed class WatchHistoryItemDto
{
    public Guid VideoId { get; init; }

    public int ProgressSeconds { get; init; }

    public bool Completed { get; init; }

    public DateTimeOffset LastWatchedAt { get; init; }

    public VideoListItemDto Video { get; init; } =
        new();
}