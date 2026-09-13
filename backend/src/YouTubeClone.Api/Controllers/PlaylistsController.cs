using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Playlists;
using YouTubeClone.Application.Features.Playlists;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/playlists")]
public sealed class PlaylistsController : ControllerBase
{
    private readonly IPlaylistService _playlistService;

    public PlaylistsController(IPlaylistService playlistService)
    {
        _playlistService = playlistService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PlaylistResponseDto>>> List(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var playlists = await _playlistService.ListAsync(
            userId.Value,
            cancellationToken);

        return Ok(
            playlists
                .Select(Map)
                .ToList());
    }

    [HttpPost]
    public async Task<ActionResult<PlaylistResponseDto>> Create(
        SavePlaylistRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _playlistService.CreateAsync(
            userId.Value,
            new SavePlaylistCommand(
                request.Title,
                request.Description),
            cancellationToken);

        return result.Playlist is not null
            ? Ok(Map(result.Playlist))
            : MapError(result.Error);
    }

    [HttpPut("{playlistId:guid}")]
    public async Task<ActionResult<PlaylistResponseDto>> Update(
        Guid playlistId,
        SavePlaylistRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _playlistService.UpdateAsync(
            userId.Value,
            playlistId,
            new SavePlaylistCommand(
                request.Title,
                request.Description),
            cancellationToken);

        return result.Playlist is not null
            ? Ok(Map(result.Playlist))
            : MapError(result.Error);
    }

    [HttpDelete("{playlistId:guid}")]
    public async Task<IActionResult> Delete(
        Guid playlistId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var deleted = await _playlistService.DeleteAsync(
            userId.Value,
            playlistId,
            cancellationToken);

        return deleted
            ? NoContent()
            : NotFound();
    }

    private ActionResult<PlaylistResponseDto> MapError(
        PlaylistError error) =>
        error switch
        {
            PlaylistError.NotFound => NotFound(),
            PlaylistError.TitleRequired =>
                BadRequest(new { message = "Playlist title is required." }),
            PlaylistError.TitleTooLong =>
                BadRequest(new { message = "Playlist title must not exceed 80 characters." }),
            PlaylistError.DescriptionTooLong =>
                BadRequest(new { message = "Playlist description must not exceed 300 characters." }),
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

    private static PlaylistResponseDto Map(
        PlaylistModel playlist) =>
        new(
            playlist.Id,
            playlist.Title,
            playlist.Description,
            playlist.CreatedAt,
            playlist.UpdatedAt);
}
