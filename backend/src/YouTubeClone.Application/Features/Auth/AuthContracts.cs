namespace YouTubeClone.Application.Features.Auth;

public sealed record CurrentUserModel(
    Guid Id,
    string Email,
    string DisplayName,
    string Handle,
    string Bio);

public sealed record AuthSession(
    CurrentUserModel User,
    string AccessToken,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);

public sealed record RegisterUserCommand(
    string Email,
    string Password,
    string DisplayName,
    string? UserName);

public sealed record LoginUserCommand(
    string Email,
    string Password);

public enum AuthError
{
    None,
    DuplicateEmail,
    DuplicateUserName,
    InvalidCredentials,
    InvalidRefreshToken
}

public sealed record AuthResult(
    AuthSession? Session,
    AuthError Error)
{
    public static AuthResult Success(AuthSession session) =>
        new(session, AuthError.None);

    public static AuthResult Failure(AuthError error) =>
        new(null, error);
}
