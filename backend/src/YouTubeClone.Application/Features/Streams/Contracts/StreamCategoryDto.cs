namespace YouTubeClone.Application.Features.Streams.Contracts;

public sealed class StreamCategoryDto
{
    public string Name { get; init; } =
        string.Empty;

    public string Slug { get; init; } =
        string.Empty;

    public int LiveStreamCount { get; init; }

    public int ViewerCount { get; init; }
}