using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YouTubeClone.Api.DTOs.Playlists;
using YouTubeClone.Domain.Playlists;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/playlists")]
public sealed class PlaylistsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PlaylistDto>>> GetAll(CancellationToken cancellationToken)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();

        var playlists = await db.Playlists
            .Where(item => item.OwnerId == ownerId)
            .Include(item => item.Videos)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);
        return Ok(playlists.Select(Map).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<PlaylistDto>> Create(CreatePlaylistRequestDto request, CancellationToken cancellationToken)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(new { message = "Title is required." });

        var playlist = new Playlist
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId.Value,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.Playlists.Add(playlist);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { playlistId = playlist.Id }, Map(playlist));
    }

    [HttpGet("{playlistId:guid}")]
    public async Task<ActionResult<PlaylistDto>> GetById(Guid playlistId, CancellationToken cancellationToken)
    {
        var playlist = await FindOwnedPlaylist(playlistId, cancellationToken);
        return playlist is null ? NotFound() : Ok(Map(playlist));
    }

    [HttpPut("{playlistId:guid}")]
    public async Task<ActionResult<PlaylistDto>> Update(Guid playlistId, UpdatePlaylistRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(new { message = "Title is required." });
        var playlist = await FindOwnedPlaylist(playlistId, cancellationToken);
        if (playlist is null) return NotFound();
        playlist.Title = request.Title.Trim();
        playlist.Description = request.Description.Trim();
        await db.SaveChangesAsync(cancellationToken);
        return Ok(Map(playlist));
    }

    [HttpDelete("{playlistId:guid}")]
    public async Task<IActionResult> Delete(Guid playlistId, CancellationToken cancellationToken)
    {
        var playlist = await FindOwnedPlaylist(playlistId, cancellationToken);
        if (playlist is null) return NotFound();
        db.Playlists.Remove(playlist);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{playlistId:guid}/videos/{videoId:guid}")]
    public async Task<ActionResult<PlaylistDto>> AddVideo(Guid playlistId, Guid videoId, CancellationToken cancellationToken)
    {
        var playlist = await FindOwnedPlaylist(playlistId, cancellationToken);
        if (playlist is null) return NotFound();
        if (playlist.Videos.Any(item => item.VideoId == videoId)) return Conflict(new { message = "Video is already in the playlist." });
        playlist.Videos.Add(new PlaylistVideo { PlaylistId = playlist.Id, VideoId = videoId, AddedAt = DateTimeOffset.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
        return Ok(Map(playlist));
    }

    [HttpDelete("{playlistId:guid}/videos/{videoId:guid}")]
    public async Task<IActionResult> RemoveVideo(Guid playlistId, Guid videoId, CancellationToken cancellationToken)
    {
        var playlist = await FindOwnedPlaylist(playlistId, cancellationToken);
        if (playlist is null) return NotFound();
        var item = playlist.Videos.SingleOrDefault(video => video.VideoId == videoId);
        if (item is null) return NotFound();
        db.PlaylistVideos.Remove(item);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private Guid? GetOwnerId()
    {
        var subject = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(subject, out var ownerId) ? ownerId : null;
    }

    private async Task<Playlist?> FindOwnedPlaylist(Guid playlistId, CancellationToken cancellationToken)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return null;
        return await db.Playlists.Include(item => item.Videos)
            .SingleOrDefaultAsync(item => item.Id == playlistId && item.OwnerId == ownerId, cancellationToken);
    }

    private static PlaylistDto Map(Playlist playlist) => new(
        playlist.Id, playlist.Title, playlist.Description, playlist.CreatedAt,
        playlist.Videos.OrderBy(item => item.AddedAt).Select(item => item.VideoId).ToList());
}
