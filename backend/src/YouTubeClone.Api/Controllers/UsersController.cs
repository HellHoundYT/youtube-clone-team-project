using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Api.Mappers;
using YouTubeClone.Application.Abstractions.Storage;
using YouTubeClone.Application.Features.Users;

namespace YouTubeClone.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/users")]
public sealed class UsersController : ControllerBase
{
    private const long MaxAvatarFileSize =
        5L * 1024L * 1024L;

    private static readonly HashSet<string>
        AllowedAvatarExtensions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ".png",
            ".jpg",
            ".jpeg",
            ".webp"
        };

    private readonly IUserProfileService _userProfileService;
    private readonly IFileStorageService _fileStorageService;

    public UsersController(
        IUserProfileService userProfileService,
        IFileStorageService fileStorageService)
    {
        _userProfileService = userProfileService;
        _fileStorageService = fileStorageService;
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
            : Ok(UserDtoMapper.Map(user));
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
                request.Bio,
                request.ThemeId),
            cancellationToken);

        if (result.User is not null)
        {
            return Ok(UserDtoMapper.Map(result.User));
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

    [HttpPost("me/avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxAvatarFileSize)]
    public async Task<ActionResult<CurrentUserDto>> UpdateAvatar(
        [FromForm] IFormFile file,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(
                new { message = "Avatar image is required." });
        }

        if (file.Length > MaxAvatarFileSize)
        {
            return BadRequest(
                new { message = "Avatar image must not exceed 5 MB." });
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedAvatarExtensions.Contains(extension))
        {
            return BadRequest(
                new { message = "Avatar must be PNG, JPEG, or WebP." });
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
                new { message = "Avatar file content is not a valid supported image." });
        }

        bufferedImage.Position = 0;

        var result = await _userProfileService.UpdateAvatarAsync(
            userId.Value,
            bufferedImage,
            extension,
            cancellationToken);

        return result.User is null
            ? Unauthorized()
            : Ok(UserDtoMapper.Map(result.User));
    }

    [AllowAnonymous]
    [HttpGet("{userId:guid}/avatar")]
    public async Task<IActionResult> GetAvatar(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var avatarPath = await _userProfileService.GetAvatarPathAsync(
            userId,
            cancellationToken);

        if (string.IsNullOrWhiteSpace(avatarPath) ||
            !_fileStorageService.Exists(avatarPath))
        {
            return NotFound();
        }

        return File(
            _fileStorageService.OpenRead(avatarPath),
            _fileStorageService.GetContentType(avatarPath));
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
}
