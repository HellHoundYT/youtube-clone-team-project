using YouTubeClone.Domain.Users;

namespace YouTubeClone.Application.Features.Auth;

public interface IUserAccountRepository
{
    Task<User?> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<User?> GetUserByEmailAsync(
        string email,
        CancellationToken cancellationToken);

    Task<bool> EmailExistsAsync(
        string email,
        Guid? excludingUserId,
        CancellationToken cancellationToken);

    Task<bool> UserNameExistsAsync(
        string userName,
        Guid? excludingUserId,
        CancellationToken cancellationToken);

    Task<RefreshToken?> GetRefreshTokenWithUserAsync(
        string tokenHash,
        CancellationToken cancellationToken);

    Task<RefreshToken?> GetRefreshTokenForUserAsync(
        Guid userId,
        string tokenHash,
        CancellationToken cancellationToken);

    void AddUser(User user);

    void AddRefreshToken(RefreshToken refreshToken);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}
