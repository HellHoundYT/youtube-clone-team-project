using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Videos;
using YouTubeClone.Api.Services.Videos;
using YouTubeClone.Api.Storage;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/videos")]
public sealed class VideosController : ControllerBase
{
    private const long MaxVideoFileSize =
        500L * 1024L * 1024L;

    private static readonly HashSet<string>
        AllowedCategories =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "Music",
            "Games",
            "Cybersport",
            "Education",
            "Programming",
            "Films",
            "Podcasts",
            "Mixes"
        };

    private static readonly Guid
        DevelopmentChannelId =
            Guid.Parse(
                "77777777-7777-7777-7777-777777777777");

    private readonly IVideoService
        _videoService;

    private readonly IFileStorageService
        _fileStorageService;

    public VideosController(
        IVideoService videoService,
        IFileStorageService fileStorageService)
    {
        _videoService =
            videoService;

        _fileStorageService =
            fileStorageService;
    }

    [HttpGet]
    public async Task<
        ActionResult<IReadOnlyList<VideoListItemDto>>>
        GetVideos(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string? category = null,
            CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            return BadRequest(new
            {
                message =
                    "Page must be greater than zero."
            });
        }

        if (pageSize < 1 ||
            pageSize > 50)
        {
            return BadRequest(new
            {
                message =
                    "Page size must be between 1 and 50."
            });
        }

        var videos =
            await _videoService.GetVideosAsync(
                page,
                pageSize,
                category,
                cancellationToken);

        return Ok(videos);
    }

    [HttpGet("{videoId:guid}")]
    public async Task<ActionResult<VideoDetailsDto>>
        GetVideo(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        var video =
            await _videoService.GetVideoByIdAsync(
                videoId,
                cancellationToken);

        if (video is null)
        {
            return NotFound(new
            {
                message =
                    "Video was not found."
            });
        }

        return Ok(video);
    }

    [HttpGet("{videoId:guid}/stream")]
    public async Task<IActionResult>
        StreamVideo(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        var video =
            await _videoService.GetVideoByIdAsync(
                videoId,
                cancellationToken);

        if (video is null)
        {
            return NotFound(new
            {
                message =
                    "Video was not found."
            });
        }

        var relativePath =
            Path.Combine(
                "videos",
                $"{videoId}.mp4");

        if (!_fileStorageService.Exists(
                relativePath))
        {
            return NotFound(new
            {
                message =
                    "Video file was not found."
            });
        }

        var stream =
            _fileStorageService.OpenRead(
                relativePath);

        var contentType =
            _fileStorageService.GetContentType(
                relativePath);

        return File(
            stream,
            contentType,
            enableRangeProcessing: true);
    }

    [HttpPost("{videoId:guid}/view")]
    public async Task<IActionResult>
        RegisterView(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        var viewCount =
            await _videoService.RegisterViewAsync(
                videoId,
                cancellationToken);

        if (viewCount is null)
        {
            return NotFound(new
            {
                message =
                    "Video was not found."
            });
        }

        return NoContent();
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxVideoFileSize)]
    public async Task<ActionResult<VideoDetailsDto>>
        UploadVideo(
            [FromForm] VideoUploadFormDto request,
            CancellationToken cancellationToken = default)
    {
        var validationResult =
            ValidateUpload(request);

        if (validationResult is not null)
        {
            return validationResult;
        }

        var videoId =
            Guid.NewGuid();

        var relativePath =
            Path.Combine(
                "videos",
                $"{videoId}.mp4");

        await using var source =
            request.File!.OpenReadStream();

        await _fileStorageService.SaveAsync(
            relativePath,
            source,
            cancellationToken);

        var category =
            string.IsNullOrWhiteSpace(
                request.Category)
                ? null
                : request.Category.Trim();

        var video =
            new VideoDetailsDto
            {
                Id =
                    videoId,
                ChannelId =
                    DevelopmentChannelId,
                ChannelName =
                    "AMTLIS Uploads",
                ChannelAvatarPath =
                    null,
                Category =
                    category,
                CategorySlug =
                    category?.ToLowerInvariant(),
                Title =
                    request.Title.Trim(),
                Description =
                    string.IsNullOrWhiteSpace(
                        request.Description)
                        ? null
                        : request.Description.Trim(),
                VideoPath =
                    $"/api/v1/videos/{videoId}/stream",
                ThumbnailPath =
                    null,
                DurationSeconds =
                    request.DurationSeconds,
                ViewCount =
                    0,
                Visibility =
                    "Public",
                PublishedAt =
                    DateTimeOffset.UtcNow
            };

        try
        {
            var created =
                await _videoService.CreateVideoAsync(
                    video,
                    cancellationToken);

            return CreatedAtAction(
                nameof(GetVideo),
                new
                {
                    videoId =
                        created.Id
                },
                created);
        }
        catch
        {
            _fileStorageService.Delete(
                relativePath);

            throw;
        }
    }

    private ActionResult? ValidateUpload(
        VideoUploadFormDto request)
    {
        if (string.IsNullOrWhiteSpace(
                request.Title))
        {
            return BadRequest(new
            {
                message =
                    "Video title is required."
            });
        }

        if (request.Title.Trim().Length > 200)
        {
            return BadRequest(new
            {
                message =
                    "Video title must not exceed 200 characters."
            });
        }

        if (request.Description?.Length > 5000)
        {
            return BadRequest(new
            {
                message =
                    "Video description must not exceed 5000 characters."
            });
        }

        if (request.DurationSeconds < 1)
        {
            return BadRequest(new
            {
                message =
                    "Video duration must be greater than zero."
            });
        }

        if (!string.IsNullOrWhiteSpace(
                request.Category) &&
            !AllowedCategories.Contains(
                request.Category.Trim()))
        {
            return BadRequest(new
            {
                message =
                    "Video category is invalid."
            });
        }

        if (request.File is null ||
            request.File.Length == 0)
        {
            return BadRequest(new
            {
                message =
                    "Video file is required."
            });
        }

        if (request.File.Length >
            MaxVideoFileSize)
        {
            return BadRequest(new
            {
                message =
                    "Video file must not exceed 500 MB."
            });
        }

        if (!string.Equals(
                Path.GetExtension(
                    request.File.FileName),
                ".mp4",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message =
                    "Only MP4 video files are supported."
            });
        }

        return null;
    }
}