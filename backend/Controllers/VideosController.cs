using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Videos;
using YouTubeClone.Api.Services.Videos;
using YouTubeClone.Api.Storage;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/videos")]
public sealed class VideosController : ControllerBase
{
    private readonly IVideoReadService _videoReadService;
    private readonly IFileStorageService _fileStorageService;

    public VideosController(
        IVideoReadService videoReadService,
        IFileStorageService fileStorageService)
    {
        _videoReadService = videoReadService;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(IReadOnlyList<VideoListItemDto>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<VideoListItemDto>>> GetVideos(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] string? category = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            return BadRequest(new
            {
                message = "Page must be greater than zero."
            });
        }

        if (pageSize < 1 || pageSize > 50)
        {
            return BadRequest(new
            {
                message = "Page size must be between 1 and 50."
            });
        }

        var videos = await _videoReadService.GetVideosAsync(
            page,
            pageSize,
            category,
            cancellationToken);

        return Ok(videos);
    }

    [HttpGet("{videoId:guid}")]
    [ProducesResponseType(
        typeof(VideoDetailsDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VideoDetailsDto>> GetVideo(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        var video = await _videoReadService.GetVideoByIdAsync(
            videoId,
            cancellationToken);

        if (video is null)
        {
            return NotFound(new
            {
                message = "Video was not found."
            });
        }

        return Ok(video);
    }

    [HttpGet("{videoId:guid}/stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status206PartialContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StreamVideo(
        Guid videoId,
        CancellationToken cancellationToken = default)
    {
        var video = await _videoReadService.GetVideoByIdAsync(
            videoId,
            cancellationToken);

        if (video is null)
        {
            return NotFound(new
            {
                message = "Video was not found."
            });
        }

        var relativePath =
            Path.Combine("videos", $"{videoId}.mp4");

        if (!_fileStorageService.Exists(relativePath))
        {
            return NotFound(new
            {
                message = "Video file was not found."
            });
        }

        var stream =
            _fileStorageService.OpenRead(relativePath);

        var contentType =
            _fileStorageService.GetContentType(relativePath);

        return File(
            stream,
            contentType,
            enableRangeProcessing: true);
    }
}