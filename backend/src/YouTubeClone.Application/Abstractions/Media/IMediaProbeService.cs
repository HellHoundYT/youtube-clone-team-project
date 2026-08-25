namespace YouTubeClone.Application.Abstractions.Media;

public interface IMediaProbeService
{
    Task<MediaProbeResult> ProbeAsync(
        string filePath,
        CancellationToken cancellationToken = default);
}