using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/users")]
public sealed class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserDto>> Me(CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(subject, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync([userId], cancellationToken);
        return user is null
            ? Unauthorized()
            : Ok(Map(user));
    }

    [HttpPut("me")]
    public async Task<ActionResult<CurrentUserDto>> UpdateMe(
        UpdateCurrentUserRequestDto request,
        CancellationToken cancellationToken)
    {
        var subject = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(subject, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync([userId], cancellationToken);
        if (user is null)
            return Unauthorized();

        var email = request.Email.Trim().ToLowerInvariant();
        var userName = request.Handle.Trim().TrimStart('@');
        if (string.IsNullOrWhiteSpace(userName))
            return BadRequest(new { message = "Handle is required." });

        var isEmailTaken = await _db.Users.AnyAsync(item => item.Id != user.Id && item.Email == email, cancellationToken);
        var isUserNameTaken = await _db.Users.AnyAsync(item => item.Id != user.Id && item.UserName == userName, cancellationToken);
        if (isEmailTaken)
            return Conflict(new { message = "Email is already registered." });
        if (isUserNameTaken)
            return Conflict(new { message = "Username is already registered." });

        user.Email = email;
        user.UserName = userName;
        user.DisplayName = request.DisplayName.Trim();
        user.Bio = request.Bio.Trim();
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(Map(user));
    }

    private static CurrentUserDto Map(User user) =>
        new(user.Id, user.Email, user.DisplayName, $"@{user.UserName}", user.Bio);
}
