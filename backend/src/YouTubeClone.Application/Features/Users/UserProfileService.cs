using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Domain.Users;

namespace YouTubeClone.Application.Features.Users;

public sealed class UserProfileService : IUserProfileService
{
    private readonly IUserAccountRepository _repository;

    public UserProfileService(IUserAccountRepository repository)
    {
        _repository = repository;
    }

    public async Task<CurrentUserModel?> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await _repository.GetUserByIdAsync(
            userId,
            cancellationToken);

        return user is null
            ? null
            : MapUser(user);
    }

    public async Task<UserProfileResult> UpdateCurrentUserAsync(
        Guid userId,
        UpdateUserProfileCommand command,
        CancellationToken cancellationToken)
    {
        var user = await _repository.GetUserByIdAsync(
            userId,
            cancellationToken);

        if (user is null)
        {
            return UserProfileResult.Failure(
                UserProfileError.UserNotFound);
        }

        var email = command.Email.Trim().ToLowerInvariant();
        var userName = command.Handle.Trim().TrimStart('@');

        if (string.IsNullOrWhiteSpace(userName))
        {
            return UserProfileResult.Failure(
                UserProfileError.HandleRequired);
        }

        if (await _repository.EmailExistsAsync(
                email,
                user.Id,
                cancellationToken))
        {
            return UserProfileResult.Failure(
                UserProfileError.EmailTaken);
        }

        if (await _repository.UserNameExistsAsync(
                userName,
                user.Id,
                cancellationToken))
        {
            return UserProfileResult.Failure(
                UserProfileError.UserNameTaken);
        }

        user.Email = email;
        user.UserName = userName;
        user.DisplayName = command.DisplayName.Trim();
        user.Bio = command.Bio.Trim();

        await _repository.SaveChangesAsync(cancellationToken);

        return UserProfileResult.Success(MapUser(user));
    }

    private static CurrentUserModel MapUser(User user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            $"@{user.UserName}",
            user.Bio);
}
