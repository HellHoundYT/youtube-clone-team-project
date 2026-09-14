using YouTubeClone.Application.Abstractions.Storage;
using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Domain.Users;

namespace YouTubeClone.Application.Features.Users;

public sealed class UserProfileService : IUserProfileService
{
    private readonly IUserAccountRepository _repository;
    private readonly IFileStorageService _fileStorageService;

    public UserProfileService(
        IUserAccountRepository repository,
        IFileStorageService fileStorageService)
    {
        _repository = repository;
        _fileStorageService = fileStorageService;
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
        user.ThemeId = string.IsNullOrWhiteSpace(command.ThemeId)
            ? null
            : command.ThemeId.Trim();

        await _repository.SaveChangesAsync(cancellationToken);

        return UserProfileResult.Success(MapUser(user));
    }

    public async Task<UserProfileResult> UpdateAvatarAsync(
        Guid userId,
        Stream source,
        string extension,
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

        var normalizedExtension =
            extension.StartsWith('.')
                ? extension.ToLowerInvariant()
                : $".{extension.ToLowerInvariant()}";

        var newAvatarPath = Path.Combine(
            "avatars",
            user.Id.ToString("N"),
            $"{Guid.NewGuid():N}{normalizedExtension}");

        var previousAvatarPath = user.AvatarPath;

        await _fileStorageService.SaveAsync(
            newAvatarPath,
            source,
            cancellationToken);

        user.AvatarPath = newAvatarPath;

        try
        {
            await _repository.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            user.AvatarPath = previousAvatarPath;
            _fileStorageService.Delete(newAvatarPath);
            throw;
        }

        if (!string.IsNullOrWhiteSpace(previousAvatarPath))
        {
            _fileStorageService.Delete(previousAvatarPath);
        }

        return UserProfileResult.Success(MapUser(user));
    }

    public async Task<string?> GetAvatarPathAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await _repository.GetUserByIdAsync(
            userId,
            cancellationToken);

        return user?.AvatarPath;
    }

    private static CurrentUserModel MapUser(User user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            $"@{user.UserName}",
            user.Bio,
            user.AvatarPath,
            user.ThemeId);
}
