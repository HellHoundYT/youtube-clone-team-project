namespace YouTubeClone.Api.Services.Media;

public interface IMediaProbeService
{
    Task<MediaProbeResult> ProbeAsync(
        string filePath,
        CancellationToken cancellationToken = default);
}