using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Channels;
using YouTubeClone.Application.Abstractions.Storage;
using YouTubeClone.Application.Features.Channels;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/channels")]
public sealed class ChannelsController : ControllerBase
{
    private const long MaxAvatarFileSize =
        5L * 1024L * 1024L;

    private const long MaxBannerFileSize =
        10L * 1024L * 1024L;

    private static readonly HashSet<string>
        AllowedImageExtensions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ".png",
            ".jpg",
            ".jpeg",
            ".webp"
        };

    private readonly IChannelService _channelService;
    private readonly IFileStorageService _fileStorageService;

    public ChannelsController(
        IChannelService channelService,
        IFileStorageService fileStorageService)
    {
        _channelService = channelService;
        _fileStorageService = fileStorageService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ChannelResponseDto>>> List(
        CancellationToken cancellationToken)
    {
        var viewerUserId = GetUserId();
        var channels = await _channelService.ListAsync(
            viewerUserId,
            cancellationToken);

        return Ok(
            channels
                .Select(channel => Map(channel, viewerUserId))
                .ToList());
    }

    [HttpGet("{channelId:guid}")]
    public async Task<ActionResult<ChannelResponseDto>> Get(
        Guid channelId,
        CancellationToken cancellationToken)
    {
        var viewerUserId = GetUserId();
        var channel = await _channelService.GetAsync(
            channelId,
            viewerUserId,
            cancellationToken);

        return channel is null
            ? NotFound()
            : Ok(Map(channel, viewerUserId));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ChannelResponseDto>> Me(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _channelService.EnsureOwnedAsync(
            userId.Value,
            cancellationToken);

        return result.Channel is null
            ? StatusCode(
                StatusCodes.Status500InternalServerError,
                new { message = "The channel could not be loaded." })
            : Ok(Map(result.Channel, userId));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ChannelResponseDto>> Create(
        SaveChannelRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _channelService.CreateAsync(
            userId.Value,
            new SaveChannelCommand(
                request.Name,
                request.Handle,
                request.Description),
            cancellationToken);

        if (result.Channel is not null)
        {
            return CreatedAtAction(
                nameof(Get),
                new { channelId = result.Channel.Id },
                Map(result.Channel, userId));
        }

        return MapError(result.Error);
    }

    [Authorize]
    [HttpPut("{channelId:guid}")]
    public async Task<ActionResult<ChannelResponseDto>> Update(
        Guid channelId,
        SaveChannelRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _channelService.UpdateAsync(
            userId.Value,
            channelId,
            new SaveChannelCommand(
                request.Name,
                request.Handle,
                request.Description),
            cancellationToken);

        if (result.Channel is not null)
        {
            return Ok(Map(result.Channel, userId));
        }

        return MapError(result.Error);
    }

    [Authorize]
    [HttpPost("{channelId:guid}/avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxAvatarFileSize)]
    public Task<ActionResult<ChannelResponseDto>> UpdateAvatar(
        Guid channelId,
        [FromForm] IFormFile file,
        CancellationToken cancellationToken) =>
        UpdateImageAsync(
            channelId,
            file,
            ChannelImageKind.Avatar,
            MaxAvatarFileSize,
            cancellationToken);

    [Authorize]
    [HttpPost("{channelId:guid}/banner")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxBannerFileSize)]
    public Task<ActionResult<ChannelResponseDto>> UpdateBanner(
        Guid channelId,
        [FromForm] IFormFile file,
        CancellationToken cancellationToken) =>
        UpdateImageAsync(
            channelId,
            file,
            ChannelImageKind.Banner,
            MaxBannerFileSize,
            cancellationToken);

    [Authorize]
    [HttpGet("subscriptions")]
    public async Task<ActionResult<IReadOnlyList<ChannelResponseDto>>> Subscriptions(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var channels = await _channelService.ListSubscriptionsAsync(
            userId.Value,
            cancellationToken);

        return Ok(
            channels
                .Select(channel => Map(channel, userId))
                .ToList());
    }

    [Authorize]
    [HttpPost("{channelId:guid}/subscribe")]
    public async Task<IActionResult> Subscribe(
        Guid channelId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var error = await _channelService.SubscribeAsync(
            userId.Value,
            channelId,
            cancellationToken);

        return error switch
        {
            ChannelError.None => NoContent(),
            ChannelError.NotFound => NotFound(),
            ChannelError.CannotSubscribeOwnChannel =>
                BadRequest(new { message = "You cannot subscribe to your own channel." }),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }

    [Authorize]
    [HttpDelete("{channelId:guid}/subscribe")]
    public async Task<IActionResult> Unsubscribe(
        Guid channelId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var error = await _channelService.UnsubscribeAsync(
            userId.Value,
            channelId,
            cancellationToken);

        return error switch
        {
            ChannelError.None => NoContent(),
            ChannelError.NotFound => NotFound(),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }

    [AllowAnonymous]
    [HttpGet("{channelId:guid}/avatar")]
    public async Task<IActionResult> Avatar(
        Guid channelId,
        CancellationToken cancellationToken)
    {
        var channel = await _channelService.GetAsync(
            channelId,
            null,
            cancellationToken);

        return channel is null
            ? NotFound()
            : StreamStoredImage(channel.AvatarPath);
    }

    [AllowAnonymous]
    [HttpGet("{channelId:guid}/banner")]
    public async Task<IActionResult> Banner(
        Guid channelId,
        CancellationToken cancellationToken)
    {
        var channel = await _channelService.GetAsync(
            channelId,
            null,
            cancellationToken);

        return channel is null
            ? NotFound()
            : StreamStoredImage(channel.BannerPath);
    }

    private async Task<ActionResult<ChannelResponseDto>> UpdateImageAsync(
        Guid channelId,
        IFormFile file,
        ChannelImageKind imageKind,
        long maxFileSize,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var channel = await _channelService.GetAsync(
            channelId,
            userId.Value,
            cancellationToken);

        if (channel is null)
        {
            return NotFound();
        }

        if (channel.OwnerId != userId.Value)
        {
            return Forbid();
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(
                new { message = "Channel image is required." });
        }

        if (file.Length > maxFileSize)
        {
            return BadRequest(
                new
                {
                    message = imageKind == ChannelImageKind.Avatar
                        ? "Channel avatar must not exceed 5 MB."
                        : "Channel banner must not exceed 10 MB."
                });
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedImageExtensions.Contains(extension))
        {
            return BadRequest(
                new { message = "Channel image must be PNG, JPEG, or WebP." });
        }

        await using var source = file.OpenReadStream();
        using var bufferedImage = new MemoryStream();
        await source.CopyToAsync(
            bufferedImage,
            cancellationToken);

        bufferedImage.Position = 0;
        if (!HasValidImageSignature(
                bufferedImage,
                extension))
        {
            return BadRequest(
                new { message = "Channel image content is not a valid supported image." });
        }

        bufferedImage.Position = 0;

        var normalizedExtension = extension.ToLowerInvariant();
        var fileName = imageKind == ChannelImageKind.Avatar
            ? $"avatar{normalizedExtension}"
            : $"banner{normalizedExtension}";
        var relativePath = Path.Combine(
            "channels",
            channelId.ToString("N"),
            fileName);
        var previousPath = imageKind == ChannelImageKind.Avatar
            ? channel.AvatarPath
            : channel.BannerPath;

        try
        {
            await _fileStorageService.SaveAsync(
                relativePath,
                bufferedImage,
                cancellationToken);

            var result = await _channelService.UpdateImageAsync(
                userId.Value,
                channelId,
                imageKind,
                relativePath,
                cancellationToken);

            if (result.Channel is null)
            {
                _fileStorageService.Delete(relativePath);
                return MapError(result.Error);
            }

            if (!string.IsNullOrWhiteSpace(previousPath) &&
                !string.Equals(
                    previousPath,
                    relativePath,
                    StringComparison.OrdinalIgnoreCase))
            {
                _fileStorageService.Delete(previousPath);
            }

            return Ok(Map(result.Channel, userId));
        }
        catch
        {
            _fileStorageService.Delete(relativePath);
            throw;
        }
    }

    private IActionResult StreamStoredImage(string? path)
    {
        if (string.IsNullOrWhiteSpace(path) ||
            !_fileStorageService.Exists(path))
        {
            return NotFound();
        }

        Response.Headers["Cache-Control"] = "no-store";

        return File(
            _fileStorageService.OpenRead(path),
            _fileStorageService.GetContentType(path));
    }

    private ActionResult<ChannelResponseDto> MapError(ChannelError error) =>
        error switch
        {
            ChannelError.NotFound => NotFound(),
            ChannelError.OwnerNotFound => Unauthorized(),
            ChannelError.AlreadyOwnsChannel =>
                Conflict(new { message = "This account already has a channel." }),
            ChannelError.NameRequired =>
                BadRequest(new { message = "Channel name is required." }),
            ChannelError.HandleRequired =>
                BadRequest(new { message = "Channel handle is required." }),
            ChannelError.HandleTaken =>
                Conflict(new { message = "Channel handle is already registered." }),
            ChannelError.Forbidden => Forbid(),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };

    private Guid? GetUserId()
    {
        var subject =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(subject, out var userId)
            ? userId
            : null;
    }

    private static bool HasValidImageSignature(
        Stream stream,
        string extension)
    {
        Span<byte> header = stackalloc byte[12];
        var read = stream.Read(header);
        stream.Position = 0;

        if (extension.Equals(
                ".png",
                StringComparison.OrdinalIgnoreCase))
        {
            ReadOnlySpan<byte> pngSignature =
                [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

            return read >= pngSignature.Length &&
                header[..pngSignature.Length]
                    .SequenceEqual(pngSignature);
        }

        if (extension.Equals(
                ".jpg",
                StringComparison.OrdinalIgnoreCase) ||
            extension.Equals(
                ".jpeg",
                StringComparison.OrdinalIgnoreCase))
        {
            return read >= 3 &&
                header[0] == 0xFF &&
                header[1] == 0xD8 &&
                header[2] == 0xFF;
        }

        if (extension.Equals(
                ".webp",
                StringComparison.OrdinalIgnoreCase))
        {
            return read >= 12 &&
                header[..4].SequenceEqual("RIFF"u8) &&
                header[8..12].SequenceEqual("WEBP"u8);
        }

        return false;
    }

    private static ChannelResponseDto Map(
        ChannelModel channel,
        Guid? viewerUserId) =>
        new(
            channel.Id,
            channel.Name,
            channel.Handle,
            channel.Description,
            string.IsNullOrWhiteSpace(channel.AvatarPath)
                ? null
                : $"/api/v1/channels/{channel.Id}/avatar",
            string.IsNullOrWhiteSpace(channel.BannerPath)
                ? null
                : $"/api/v1/channels/{channel.Id}/banner",
            channel.SubscriberCount,
            channel.IsSubscribed,
            viewerUserId.HasValue &&
            viewerUserId.Value == channel.OwnerId);
}
