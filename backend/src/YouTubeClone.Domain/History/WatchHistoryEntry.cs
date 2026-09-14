namespace YouTubeClone.Domain.History;

public sealed class WatchHistoryEntry
{
    public Guid UserId { get; init; }

    public Guid VideoId { get; init; }

    public int ProgressSeconds { get; set; }

    public bool Completed { get; set; }

    public DateTimeOffset LastWatchedAt { get; set; }
}
