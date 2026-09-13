namespace YouTubeClone.Api.DTOs.Auth;

public sealed record CurrentUserDto(
    Guid Id,
    string Email,
    string DisplayName,
    string Handle,
    string Bio,
    string? AvatarUrl,
    string? ThemeId);

public sealed record AuthResponseDto(
    CurrentUserDto User,
    string AccessToken);
