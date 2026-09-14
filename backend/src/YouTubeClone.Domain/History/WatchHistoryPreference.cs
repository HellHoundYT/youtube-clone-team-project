namespace YouTubeClone.Domain.History;

public sealed class WatchHistoryPreference
{
    public Guid UserId { get; init; }

    public bool IsPaused { get; set; }
}
