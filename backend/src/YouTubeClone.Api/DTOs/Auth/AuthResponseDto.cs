namespace YouTubeClone.Api.DTOs.Auth;

public sealed record CurrentUserDto(Guid Id, string Email, string DisplayName, string Handle, string Bio);

public sealed record AuthResponseDto(CurrentUserDto User, string AccessToken, string RefreshToken);
