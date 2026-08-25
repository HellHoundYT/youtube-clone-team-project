namespace YouTubeClone.Api.DTOs.History;

public sealed class UpdateWatchHistoryRequestDto
{
    public int ProgressSeconds { get; init; }

    public bool Completed { get; init; }
}