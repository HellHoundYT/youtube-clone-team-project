namespace YouTubeClone.Domain.History;

public sealed class WatchHistoryEntry
{
    public Guid VideoId { get; init; }

    public int ProgressSeconds { get; init; }

    public bool Completed { get; init; }

    public DateTimeOffset LastWatchedAt { get; init; }
}