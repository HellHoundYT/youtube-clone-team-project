using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Application.Features.Auth;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(
        RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(
            new RegisterUserCommand(
                request.Email,
                request.Password,
                request.DisplayName,
                request.UserName),
            cancellationToken);

        if (result.Session is not null)
        {
            return Ok(Map(result.Session));
        }

        return result.Error switch
        {
            AuthError.DuplicateEmail =>
                Conflict(new { message = "Email is already registered." }),
            AuthError.DuplicateUserName =>
                Conflict(new { message = "Username is already registered." }),
            _ =>
                StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "Registration failed." })
        };
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(
        LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(
            new LoginUserCommand(
                request.Email,
                request.Password),
            cancellationToken);

        if (result.Session is not null)
        {
            return Ok(Map(result.Session));
        }

        return Unauthorized(
            new { message = "Invalid email or password." });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(
        RefreshRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshAsync(
            request.RefreshToken,
            cancellationToken);

        if (result.Session is not null)
        {
            return Ok(Map(result.Session));
        }

        return Unauthorized(
            new { message = "Refresh token is invalid or expired." });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        RefreshRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        await _authService.LogoutAsync(
            userId.Value,
            request.RefreshToken,
            cancellationToken);

        return NoContent();
    }

    private Guid? GetUserId()
    {
        var subject =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(subject, out var userId)
            ? userId
            : null;
    }

    private static AuthResponseDto Map(AuthSession session) =>
        new(
            Map(session.User),
            session.AccessToken,
            session.RefreshToken);

    private static CurrentUserDto Map(CurrentUserModel user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Handle,
            user.Bio);
}
