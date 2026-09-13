using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Application.Features.Users;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;

    public UsersController(IUserProfileService userProfileService)
    {
        _userProfileService = userProfileService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserDto>> Me(
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _userProfileService.GetCurrentUserAsync(
            userId.Value,
            cancellationToken);

        return user is null
            ? Unauthorized()
            : Ok(Map(user));
    }

    [HttpPut("me")]
    public async Task<ActionResult<CurrentUserDto>> UpdateMe(
        UpdateCurrentUserRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _userProfileService.UpdateCurrentUserAsync(
            userId.Value,
            new UpdateUserProfileCommand(
                request.Email,
                request.DisplayName,
                request.Handle,
                request.Bio),
            cancellationToken);

        if (result.User is not null)
        {
            return Ok(Map(result.User));
        }

        return result.Error switch
        {
            UserProfileError.UserNotFound =>
                Unauthorized(),
            UserProfileError.HandleRequired =>
                BadRequest(new { message = "Handle is required." }),
            UserProfileError.EmailTaken =>
                Conflict(new { message = "Email is already registered." }),
            UserProfileError.UserNameTaken =>
                Conflict(new { message = "Username is already registered." }),
            _ =>
                StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "Profile update failed." })
        };
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

    private static CurrentUserDto Map(CurrentUserModel user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Handle,
            user.Bio);
}
