using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Application.Features.Auth;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private const string RefreshTokenCookieName =
        "amtlis.refresh_token";

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
            SetRefreshTokenCookie(result.Session);
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
            SetRefreshTokenCookie(result.Session);
            return Ok(Map(result.Session));
        }

        return Unauthorized(
            new { message = "Invalid email or password." });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh(
        CancellationToken cancellationToken)
    {
        if (!TryGetRefreshToken(out var refreshToken))
        {
            return Unauthorized(
                new { message = "Refresh token is missing." });
        }

        var result = await _authService.RefreshAsync(
            refreshToken,
            cancellationToken);

        if (result.Session is not null)
        {
            SetRefreshTokenCookie(result.Session);
            return Ok(Map(result.Session));
        }

        DeleteRefreshTokenCookie();

        return Unauthorized(
            new { message = "Refresh token is invalid or expired." });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        CancellationToken cancellationToken)
    {
        if (TryGetRefreshToken(out var refreshToken))
        {
            await _authService.LogoutAsync(
                refreshToken,
                cancellationToken);
        }

        DeleteRefreshTokenCookie();
        return NoContent();
    }

    private bool TryGetRefreshToken(out string refreshToken)
    {
        if (Request.Cookies.TryGetValue(
                RefreshTokenCookieName,
                out var token) &&
            !string.IsNullOrWhiteSpace(token))
        {
            refreshToken = token;
            return true;
        }

        refreshToken = string.Empty;
        return false;
    }

    private void SetRefreshTokenCookie(AuthSession session)
    {
        Response.Cookies.Append(
            RefreshTokenCookieName,
            session.RefreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Expires = session.RefreshTokenExpiresAt,
                Path = "/api/v1/auth"
            });
    }

    private void DeleteRefreshTokenCookie()
    {
        Response.Cookies.Delete(
            RefreshTokenCookieName,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/api/v1/auth"
            });
    }

    private static AuthResponseDto Map(AuthSession session) =>
        new(
            Map(session.User),
            session.AccessToken);

    private static CurrentUserDto Map(CurrentUserModel user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Handle,
            user.Bio);
}
