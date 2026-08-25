using YouTubeClone.Application.Features.Search.Contracts;

namespace YouTubeClone.Application.Features.Search;

public interface ISearchService
{
    Task<SearchResponseDto> SearchAsync(
        string query,
        CancellationToken cancellationToken = default);
}