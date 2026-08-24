using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Videos;
using YouTubeClone.Application.Features.Videos.Contracts;
using YouTubeClone.Application.Abstractions.Media;
using YouTubeClone.Application.Features.Videos;
using YouTubeClone.Application.Abstractions.Storage;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/videos")]
public sealed class VideosController :
    ControllerBase
{
    private const long MaxVideoFileSize =
        500L * 1024L * 1024L;

    private static readonly HashSet<string>
        AllowedCategories =
        new(
            StringComparer.OrdinalIgnoreCase)
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

    private readonly IMediaProbeService
        _mediaProbeService;

    public VideosController(
        IVideoService videoService,
        IFileStorageService fileStorageService,
        IMediaProbeService mediaProbeService)
    {
        _videoService =
            videoService;

        _fileStorageService =
            fileStorageService;

        _mediaProbeService =
            mediaProbeService;
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
            return BadRequest(
                new
                {
                    message =
                        "Page must be greater than zero."
                });
        }

        if (pageSize < 1 ||
            pageSize > 50)
        {
            return BadRequest(
                new
                {
                    message =
                        "Page size must be between 1 and 50."
                });
        }

        var videos =
            await _videoService
                .GetVideosAsync(
                    page,
                    pageSize,
                    category,
                    cancellationToken);

        return Ok(
            videos);
    }

    [HttpGet("{videoId:guid}")]
    public async Task<
        ActionResult<VideoDetailsDto>>
        GetVideo(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        var video =
            await _videoService
                .GetVideoByIdAsync(
                    videoId,
                    cancellationToken);

        if (video is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Video was not found."
                });
        }

        return Ok(
            video);
    }

    [HttpGet("{videoId:guid}/stream")]
    public async Task<IActionResult>
        StreamVideo(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        var video =
            await _videoService
                .GetVideoByIdAsync(
                    videoId,
                    cancellationToken);

        if (video is null)
        {
            return NotFound(
                new
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
            return NotFound(
                new
                {
                    message =
                        "Video file was not found."
                });
        }

        var stream =
            _fileStorageService
                .OpenRead(
                    relativePath);

        var contentType =
            _fileStorageService
                .GetContentType(
                    relativePath);

        return File(
            stream,
            contentType,
            enableRangeProcessing:
                true);
    }

    [HttpPost("{videoId:guid}/view")]
    public async Task<IActionResult>
        RegisterView(
            Guid videoId,
            CancellationToken cancellationToken = default)
    {
        var viewCount =
            await _videoService
                .RegisterViewAsync(
                    videoId,
                    cancellationToken);

        if (viewCount is null)
        {
            return NotFound(
                new
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
    public async Task<
        ActionResult<VideoDetailsDto>>
        UploadVideo(
            [FromForm] VideoUploadFormDto request,
            CancellationToken cancellationToken = default)
    {
        var validationResult =
            ValidateUpload(
                request);

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

        var keepStoredFile =
            false;

        try
        {
            await using var source =
                request.File!
                    .OpenReadStream();

            await _fileStorageService
                .SaveAsync(
                    relativePath,
                    source,
                    cancellationToken);

            var physicalPath =
                _fileStorageService
                    .GetPhysicalPath(
                        relativePath);

            var probeResult =
                await _mediaProbeService
                    .ProbeAsync(
                        physicalPath,
                        cancellationToken);

            if (!probeResult.IsSuccess)
            {
                return CreateProbeFailureResponse(
                    probeResult);
            }

            var durationSeconds =
                probeResult.DurationSeconds
                ?? throw new InvalidOperationException(
                    "Successful media probe did not return a duration.");

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
                        category?
                            .ToLowerInvariant(),
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
                        durationSeconds,
                    ViewCount =
                        0,
                    Visibility =
                        "Public",
                    PublishedAt =
                        DateTimeOffset.UtcNow
                };

            var created =
                await _videoService
                    .CreateVideoAsync(
                        video,
                        cancellationToken);

            keepStoredFile =
                true;

            return CreatedAtAction(
                nameof(GetVideo),
                new
                {
                    videoId =
                        created.Id
                },
                created);
        }
        finally
        {
            if (!keepStoredFile)
            {
                _fileStorageService.Delete(
                    relativePath);
            }
        }
    }

    private ActionResult?
        ValidateUpload(
            VideoUploadFormDto request)
    {
        if (string.IsNullOrWhiteSpace(
                request.Title))
        {
            return BadRequest(
                new
                {
                    message =
                        "Video title is required."
                });
        }

        if (request.Title
            .Trim()
            .Length > 200)
        {
            return BadRequest(
                new
                {
                    message =
                        "Video title must not exceed 200 characters."
                });
        }

        if (request.Description?
            .Length > 5000)
        {
            return BadRequest(
                new
                {
                    message =
                        "Video description must not exceed 5000 characters."
                });
        }

        if (!string.IsNullOrWhiteSpace(
                request.Category) &&
            !AllowedCategories.Contains(
                request.Category.Trim()))
        {
            return BadRequest(
                new
                {
                    message =
                        "Video category is invalid."
                });
        }

        if (request.File is null ||
            request.File.Length == 0)
        {
            return BadRequest(
                new
                {
                    message =
                        "Video file is required."
                });
        }

        if (request.File.Length >
            MaxVideoFileSize)
        {
            return BadRequest(
                new
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
            return BadRequest(
                new
                {
                    message =
                        "Only MP4 video files are supported."
                });
        }

        return null;
    }

    private ActionResult
        CreateProbeFailureResponse(
            MediaProbeResult result)
    {
        return result.Status switch
        {
            MediaProbeStatus.ToolUnavailable =>
                StatusCode(
                    StatusCodes
                        .Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "Video analysis service is unavailable because ffprobe could not be started."
                    }),

            MediaProbeStatus.TimedOut =>
                StatusCode(
                    StatusCodes
                        .Status503ServiceUnavailable,
                    new
                    {
                        message =
                            "Video analysis timed out. Please try again."
                    }),

            MediaProbeStatus.InvalidMedia =>
                BadRequest(
                    new
                    {
                        message =
                            result.ErrorMessage
                            ?? "The uploaded video is invalid."
                    }),

            _ =>
                StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "Video analysis failed."
                    })
        };
    }
}