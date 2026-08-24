using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Categories;
using YouTubeClone.Application.Features.Videos.Contracts;
using YouTubeClone.Application.Features.Videos;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
public sealed class CategoriesController : ControllerBase
{
    private const int DefaultPageSize = 24;
    private const int MaxPageSize = 50;

    private static readonly IReadOnlyList<CategoryDto>
        Categories =
        [
            new CategoryDto
            {
                Name = "Games",
                Slug = "games"
            },
            new CategoryDto
            {
                Name = "Cybersport",
                Slug = "cybersport"
            },
            new CategoryDto
            {
                Name = "Education",
                Slug = "education"
            },
            new CategoryDto
            {
                Name = "Programming",
                Slug = "programming"
            },
            new CategoryDto
            {
                Name = "Music",
                Slug = "music"
            },
            new CategoryDto
            {
                Name = "Podcasts",
                Slug = "podcasts"
            },
            new CategoryDto
            {
                Name = "Films",
                Slug = "films"
            },
            new CategoryDto
            {
                Name = "Mixes",
                Slug = "mixes"
            }
        ];

    private readonly IVideoService _videoService;

    public CategoriesController(
        IVideoService videoService)
    {
        _videoService = videoService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<CategoryDto>),
        StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<CategoryDto>>
        GetCategories()
    {
        return Ok(Categories);
    }

    [HttpGet("{slug}/videos")]
    [ProducesResponseType(
        typeof(IReadOnlyList<VideoListItemDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<VideoListItemDto>>>
        GetCategoryVideos(
            string slug,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize =
                DefaultPageSize,
            CancellationToken cancellationToken =
                default)
    {
        if (page < 1)
        {
            return BadRequest(
                new
                {
                    message =
                        "Page must be greater than zero."
                });
        }

        if (pageSize < 1 ||
            pageSize > MaxPageSize)
        {
            return BadRequest(
                new
                {
                    message =
                        $"Page size must be between 1 and {MaxPageSize}."
                });
        }

        var normalizedSlug =
            slug.Trim().ToLowerInvariant();

        var category =
            Categories.FirstOrDefault(item =>
                string.Equals(
                    item.Slug,
                    normalizedSlug,
                    StringComparison.OrdinalIgnoreCase));

        if (category is null)
        {
            return NotFound(
                new
                {
                    message =
                        $"Category '{slug}' was not found."
                });
        }

        var videos =
            await _videoService.GetVideosAsync(
                page,
                pageSize,
                category.Slug,
                cancellationToken);

        return Ok(videos);
    }
}