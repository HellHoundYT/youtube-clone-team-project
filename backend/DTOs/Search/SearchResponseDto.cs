using YouTubeClone.Api.DTOs.Videos;

namespace YouTubeClone.Api.DTOs.Search;

public sealed class SearchResponseDto
{
    public string Query { get; init; } = string.Empty;

    public IReadOnlyList<VideoListItemDto> Videos { get; init; } =
        Array.Empty<VideoListItemDto>();
}