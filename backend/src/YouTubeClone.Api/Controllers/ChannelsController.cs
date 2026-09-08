using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YouTubeClone.Domain.Channels;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/channels")]
public sealed class ChannelsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public Task<List<ChannelResponse>> List(CancellationToken ct) => Query().ToListAsync(ct);

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ChannelResponse>> Get(Guid id, CancellationToken ct)
    {
        var channel = await Query().SingleOrDefaultAsync(item => item.Id == id, ct);
        return channel is null ? NotFound() : Ok(channel);
    }

    [Authorize]
    [HttpGet("subscriptions")]
    public async Task<ActionResult<IReadOnlyList<ChannelResponse>>> Subscriptions(CancellationToken ct)
    {
        var userId = GetUserId(); if (userId is null) return Unauthorized();
        return Ok(await Query().Where(channel => db.Subscriptions.Any(subscription => subscription.SubscriberId == userId && subscription.ChannelId == channel.Id)).ToListAsync(ct));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ChannelResponse>> Create(ChannelRequest request, CancellationToken ct)
    {
        var userId = GetUserId(); if (userId is null) return Unauthorized();
        var handle = request.Handle.Trim().TrimStart('@');
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(handle)) return BadRequest(new { message = "Name and handle are required." });
        if (await db.Channels.AnyAsync(channel => channel.Handle == handle, ct)) return Conflict(new { message = "Handle is already registered." });
        var channel = new Channel { Id = Guid.NewGuid(), OwnerId = userId.Value, Name = request.Name.Trim(), Handle = handle, Description = request.Description.Trim(), AvatarPath = request.AvatarPath, BannerPath = request.BannerPath, CreatedAt = DateTimeOffset.UtcNow };
        db.Channels.Add(channel); await db.SaveChangesAsync(ct); return CreatedAtAction(nameof(Get), new { id = channel.Id }, ToResponse(channel));
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ChannelResponse>> Update(Guid id, ChannelRequest request, CancellationToken ct)
    {
        var userId = GetUserId(); if (userId is null) return Unauthorized();
        var channel = await db.Channels.SingleOrDefaultAsync(item => item.Id == id, ct);
        if (channel is null) return NotFound();
        if (channel.OwnerId != userId) return Forbid();
        var handle = request.Handle.Trim().TrimStart('@');
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(handle)) return BadRequest(new { message = "Name and handle are required." });
        if (await db.Channels.AnyAsync(item => item.Id != id && item.Handle == handle, ct)) return Conflict(new { message = "Handle is already registered." });
        channel.Name = request.Name.Trim(); channel.Handle = handle; channel.Description = request.Description.Trim(); channel.AvatarPath = request.AvatarPath; channel.BannerPath = request.BannerPath;
        await db.SaveChangesAsync(ct); return Ok(await Query().SingleAsync(item => item.Id == id, ct));
    }

    [Authorize]
    [HttpPost("{id:guid}/subscribe")]
    public async Task<IActionResult> Subscribe(Guid id, CancellationToken ct)
    {
        var userId = GetUserId(); if (userId is null) return Unauthorized();
        if (!await db.Channels.AnyAsync(channel => channel.Id == id, ct)) return NotFound();
        if (!await db.Subscriptions.AnyAsync(item => item.SubscriberId == userId && item.ChannelId == id, ct)) { db.Subscriptions.Add(new Subscription { SubscriberId = userId.Value, ChannelId = id, CreatedAt = DateTimeOffset.UtcNow }); await db.SaveChangesAsync(ct); }
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:guid}/subscribe")]
    public async Task<IActionResult> Unsubscribe(Guid id, CancellationToken ct)
    {
        var userId = GetUserId(); if (userId is null) return Unauthorized();
        var subscription = await db.Subscriptions.FindAsync([userId.Value, id], ct);
        if (subscription is not null) { db.Subscriptions.Remove(subscription); await db.SaveChangesAsync(ct); }
        return NoContent();
    }

    private IQueryable<ChannelResponse> Query() => db.Channels.Select(channel => new ChannelResponse(channel.Id, channel.Name, $"@{channel.Handle}", channel.Description, channel.AvatarPath, channel.BannerPath, db.Subscriptions.Count(subscription => subscription.ChannelId == channel.Id)));
    private Guid? GetUserId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id) ? id : null;
    private ChannelResponse ToResponse(Channel channel) => new(channel.Id, channel.Name, $"@{channel.Handle}", channel.Description, channel.AvatarPath, channel.BannerPath, 0);
}

public sealed class ChannelRequest { public string Name { get; init; } = string.Empty; public string Handle { get; init; } = string.Empty; public string Description { get; init; } = string.Empty; public string? AvatarPath { get; init; } public string? BannerPath { get; init; } }
public sealed record ChannelResponse(Guid Id, string Name, string Handle, string Description, string? AvatarPath, string? BannerPath, int SubscriberCount);
