using YouTubeClone.Domain.Users;

namespace YouTubeClone.Application.Features.Auth;

public sealed class AuthService : IAuthService
{
    private readonly IUserAccountRepository _repository;
    private readonly IPasswordService _passwordService;
    private readonly IAuthTokenService _tokenService;

    public AuthService(
        IUserAccountRepository repository,
        IPasswordService passwordService,
        IAuthTokenService tokenService)
    {
        _repository = repository;
        _passwordService = passwordService;
        _tokenService = tokenService;
    }

    public async Task<AuthResult> RegisterAsync(
        RegisterUserCommand command,
        CancellationToken cancellationToken)
    {
        var email = command.Email.Trim().ToLowerInvariant();
        var userName = string.IsNullOrWhiteSpace(command.UserName)
            ? email.Split('@')[0]
            : command.UserName.Trim().TrimStart('@');

        if (await _repository.EmailExistsAsync(
                email,
                null,
                cancellationToken))
        {
            return AuthResult.Failure(AuthError.DuplicateEmail);
        }

        if (await _repository.UserNameExistsAsync(
                userName,
                null,
                cancellationToken))
        {
            return AuthResult.Failure(AuthError.DuplicateUserName);
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            UserName = userName,
            DisplayName = command.DisplayName.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        user.PasswordHash = _passwordService.HashPassword(
            user,
            command.Password);

        _repository.AddUser(user);

        var session = CreateSession(user);

        await _repository.SaveChangesAsync(cancellationToken);

        return AuthResult.Success(session);
    }

    public async Task<AuthResult> LoginAsync(
        LoginUserCommand command,
        CancellationToken cancellationToken)
    {
        var email = command.Email.Trim().ToLowerInvariant();
        var user = await _repository.GetUserByEmailAsync(
            email,
            cancellationToken);

        if (user is null ||
            !_passwordService.VerifyPassword(
                user,
                user.PasswordHash,
                command.Password))
        {
            return AuthResult.Failure(AuthError.InvalidCredentials);
        }

        var session = CreateSession(user);

        await _repository.SaveChangesAsync(cancellationToken);

        return AuthResult.Success(session);
    }

    public async Task<AuthResult> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var tokenHash = _tokenService.HashRefreshToken(refreshToken);
        var storedToken = await _repository.GetRefreshTokenWithUserAsync(
            tokenHash,
            cancellationToken);

        if (storedToken is null ||
            storedToken.User is null ||
            storedToken.RevokedAt is not null ||
            storedToken.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return AuthResult.Failure(AuthError.InvalidRefreshToken);
        }

        storedToken.RevokedAt = DateTimeOffset.UtcNow;

        var session = CreateSession(storedToken.User);

        await _repository.SaveChangesAsync(cancellationToken);

        return AuthResult.Success(session);
    }

    public async Task LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var tokenHash = _tokenService.HashRefreshToken(refreshToken);
        var storedToken = await _repository.GetRefreshTokenWithUserAsync(
            tokenHash,
            cancellationToken);

        if (storedToken is null ||
            storedToken.RevokedAt is not null)
        {
            return;
        }

        storedToken.RevokedAt = DateTimeOffset.UtcNow;
        await _repository.SaveChangesAsync(cancellationToken);
    }

    private AuthSession CreateSession(User user)
    {
        var rawRefreshToken = _tokenService.CreateRefreshToken();
        var refreshTokenExpiresAt =
            _tokenService.GetRefreshTokenExpiration();

        _repository.AddRefreshToken(
            new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = _tokenService.HashRefreshToken(rawRefreshToken),
                ExpiresAt = refreshTokenExpiresAt
            });

        return new AuthSession(
            MapUser(user),
            _tokenService.CreateAccessToken(user),
            rawRefreshToken,
            refreshTokenExpiresAt);
    }

    private static CurrentUserModel MapUser(User user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            $"@{user.UserName}",
            user.Bio);
}
