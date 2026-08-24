using YouTubeClone.Application.Features.Videos.Contracts;

namespace YouTubeClone.Application.Features.Search.Contracts;

public sealed class SearchResponseDto
{
    public string Query { get; init; } = string.Empty;

    public IReadOnlyList<VideoListItemDto> Videos { get; init; } =
        Array.Empty<VideoListItemDto>();
}