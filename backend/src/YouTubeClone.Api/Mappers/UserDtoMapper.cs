using YouTubeClone.Api.DTOs.Auth;
using YouTubeClone.Application.Features.Auth;

namespace YouTubeClone.Api.Mappers;

public static class UserDtoMapper
{
    public static CurrentUserDto Map(CurrentUserModel user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Handle,
            user.Bio,
            string.IsNullOrWhiteSpace(user.AvatarPath)
                ? null
                : $"/api/v1/users/{user.Id}/avatar",
            user.ThemeId);
}
