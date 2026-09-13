using YouTubeClone.Application.Features.Auth;

namespace YouTubeClone.Application.Features.Users;

public sealed record UpdateUserProfileCommand(
    string Email,
    string DisplayName,
    string Handle,
    string Bio);

public enum UserProfileError
{
    None,
    UserNotFound,
    HandleRequired,
    EmailTaken,
    UserNameTaken
}

public sealed record UserProfileResult(
    CurrentUserModel? User,
    UserProfileError Error)
{
    public static UserProfileResult Success(CurrentUserModel user) =>
        new(user, UserProfileError.None);

    public static UserProfileResult Failure(UserProfileError error) =>
        new(null, error);
}
