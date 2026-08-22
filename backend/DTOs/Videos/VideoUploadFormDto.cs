namespace YouTubeClone.Api.DTOs.Videos;

public sealed class VideoUploadFormDto
{
    public string Title { get; init; } =
        string.Empty;

    public string? Description { get; init; }

    public string? Category { get; init; }

    public int DurationSeconds { get; init; }

    public IFormFile? File { get; init; }
}