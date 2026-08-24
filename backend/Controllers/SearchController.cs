using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Application.Features.Search;
using YouTubeClone.Application.Features.Search.Contracts;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/search")]
public sealed class SearchController :
    ControllerBase
{
    private const int MaxSearchQueryLength =
        100;

    private readonly ISearchService
        _searchService;

    public SearchController(
        ISearchService searchService)
    {
        _searchService =
            searchService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(SearchResponseDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SearchResponseDto>>
        Search(
            [FromQuery] string? query,
            CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(
                query))
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

        var result =
            await _searchService.SearchAsync(
                normalizedQuery,
                cancellationToken);

        return Ok(
            result);
    }
}