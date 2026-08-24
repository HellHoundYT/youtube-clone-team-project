using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Application.Features.Categories;
using YouTubeClone.Application.Features.Categories.Contracts;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Features.Videos.Contracts;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
public sealed class CategoriesController :
    ControllerBase
{
    private const int DefaultPageSize =
        24;

    private const int MaxPageSize =
        50;

    private readonly ICategoryService
        _categoryService;

    private readonly IVideoService
        _videoService;

    public CategoriesController(
        ICategoryService categoryService,
        IVideoService videoService)
    {
        _categoryService =
            categoryService;

        _videoService =
            videoService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<CategoryDto>),
        StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<CategoryDto>>
        GetCategories()
    {
        return Ok(
            _categoryService.GetCategories());
    }

    [HttpGet("{slug}/videos")]
    [ProducesResponseType(
        typeof(IReadOnlyList<VideoListItemDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<
        ActionResult<IReadOnlyList<VideoListItemDto>>>
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

        var category =
            _categoryService.GetBySlug(
                slug);

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

        return Ok(
            videos);
    }
}