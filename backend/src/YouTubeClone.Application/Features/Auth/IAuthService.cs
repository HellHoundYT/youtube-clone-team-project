namespace YouTubeClone.Application.Features.Auth;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(
        RegisterUserCommand command,
        CancellationToken cancellationToken);

    Task<AuthResult> LoginAsync(
        LoginUserCommand command,
        CancellationToken cancellationToken);

    Task<AuthResult> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken);

    Task LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken);
}
