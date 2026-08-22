using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Search;
using YouTubeClone.Api.Services.Videos;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/search")]
public sealed class SearchController : ControllerBase
{
    private const int MaxSearchResults = 50;
    private const int MaxSearchQueryLength = 100;

    private readonly IVideoService _videoService;

    public SearchController(
        IVideoService videoService)
    {
        _videoService = videoService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(SearchResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SearchResponseDto>> Search(
        [FromQuery] string? query,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(
                new
                {
                    message =
                        "Search query is required."
                });
        }

        var normalizedQuery =
            query.Trim();

        if (normalizedQuery.Length >
            MaxSearchQueryLength)
        {
            return BadRequest(
                new
                {
                    message =
                        $"Search query must not exceed {MaxSearchQueryLength} characters."
                });
        }

        var videos =
            await _videoService.GetVideosAsync(
                page: 1,
                pageSize: 100,
                category: null,
                cancellationToken);

        var matches = videos
            .Where(video =>
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
            .OrderByDescending(video =>
                video.Title.StartsWith(
                    normalizedQuery,
                    StringComparison.OrdinalIgnoreCase))
            .ThenByDescending(video =>
                video.ViewCount)
            .ThenByDescending(video =>
                video.PublishedAt)
            .Take(MaxSearchResults)
            .ToList();

        return Ok(
            new SearchResponseDto
            {
                Query = normalizedQuery,
                Videos = matches
            });
    }

    private static bool Contains(
        string? source,
        string query)
    {
        return !string.IsNullOrWhiteSpace(source) &&
               source.Contains(
                   query,
                   StringComparison.OrdinalIgnoreCase);
    }
}