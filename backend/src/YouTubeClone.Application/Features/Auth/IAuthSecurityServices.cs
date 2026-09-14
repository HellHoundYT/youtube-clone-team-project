using YouTubeClone.Domain.Users;

namespace YouTubeClone.Application.Features.Auth;

public interface IPasswordService
{
    string HashPassword(
        User user,
        string password);

    bool VerifyPassword(
        User user,
        string passwordHash,
        string password);
}

public interface IAuthTokenService
{
    string CreateAccessToken(User user);

    string CreateRefreshToken();

    string HashRefreshToken(string refreshToken);

    DateTimeOffset GetRefreshTokenExpiration();
}
