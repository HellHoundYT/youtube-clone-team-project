using YouTubeClone.Application.Features.Search.Contracts;
using YouTubeClone.Application.Features.Videos;

namespace YouTubeClone.Application.Features.Search;

public sealed class SearchService :
    ISearchService
{
    private const int MaxSearchResults =
        50;

    private readonly IVideoService
        _videoService;

    public SearchService(
        IVideoService videoService)
    {
        _videoService =
            videoService;
    }

    public async Task<SearchResponseDto>
        SearchAsync(
            string query,
            CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var normalizedQuery =
            query.Trim();

        var videos =
            await _videoService.GetVideosAsync(
                page: 1,
                pageSize: 100,
                category: null,
                cancellationToken);

        var matches =
            videos
                .Where(
                    video =>
                        Contains(
                            video.Title,
                            normalizedQuery) ||
                        Contains(
                            video.ChannelName,
                            normalizedQuery) ||
                        Contains(
                            video.Category,
                            normalizedQuery) ||
                        Contains(
                            video.CategorySlug,
                            normalizedQuery))
                .OrderByDescending(
                    video =>
                        video.Title.StartsWith(
                            normalizedQuery,
                            StringComparison.OrdinalIgnoreCase))
                .ThenByDescending(
                    video =>
                        video.ViewCount)
                .ThenByDescending(
                    video =>
                        video.PublishedAt)
                .Take(
                    MaxSearchResults)
                .ToList();

        return new SearchResponseDto
        {
            Query =
                normalizedQuery,

            Videos =
                matches
        };
    }

    private static bool Contains(
        string? source,
        string query)
    {
        return
            !string.IsNullOrWhiteSpace(
                source) &&
            source.Contains(
                query,
                StringComparison.OrdinalIgnoreCase);
    }
}