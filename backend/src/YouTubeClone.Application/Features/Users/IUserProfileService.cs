using YouTubeClone.Application.Features.Auth;

namespace YouTubeClone.Application.Features.Users;

public interface IUserProfileService
{
    Task<CurrentUserModel?> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<UserProfileResult> UpdateCurrentUserAsync(
        Guid userId,
        UpdateUserProfileCommand command,
        CancellationToken cancellationToken);
}
