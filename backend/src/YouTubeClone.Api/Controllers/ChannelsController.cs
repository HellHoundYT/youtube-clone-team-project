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
