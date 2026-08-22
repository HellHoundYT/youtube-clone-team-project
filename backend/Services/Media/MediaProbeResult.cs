namespace YouTubeClone.Api.Services.Media;

public enum MediaProbeStatus
{
    Success,
    ToolUnavailable,
    InvalidMedia,
    TimedOut,
    Failed
}

public sealed record MediaProbeResult(
    MediaProbeStatus Status,
    int? DurationSeconds = null,
    string? ErrorMessage = null)
{
    public bool IsSuccess =>
        Status == MediaProbeStatus.Success;
}