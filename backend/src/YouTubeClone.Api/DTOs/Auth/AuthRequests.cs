using System.ComponentModel.DataAnnotations;

namespace YouTubeClone.Api.DTOs.Auth;

public sealed class RegisterRequestDto
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string DisplayName { get; init; } = string.Empty;

    [MaxLength(64)]
    public string? UserName { get; init; }
}

public sealed class LoginRequestDto
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; init; } = string.Empty;
}

public sealed class RefreshRequestDto
{
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}

public sealed class UpdateCurrentUserRequestDto
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string DisplayName { get; init; } = string.Empty;

    [Required, MaxLength(64)]
    public string Handle { get; init; } = string.Empty;

    [MaxLength(240)]
    public string Bio { get; init; } = string.Empty;
}
