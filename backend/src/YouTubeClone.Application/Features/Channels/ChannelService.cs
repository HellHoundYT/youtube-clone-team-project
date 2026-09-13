using YouTubeClone.Application.Features.Auth;
using YouTubeClone.Domain.Channels;

namespace YouTubeClone.Application.Features.Channels;

public sealed class ChannelService : IChannelService
{
    private readonly IChannelRepository _repository;
    private readonly IUserAccountRepository _userRepository;

    public ChannelService(
        IChannelRepository repository,
        IUserAccountRepository userRepository)
    {
        _repository = repository;
        _userRepository = userRepository;
    }

    public Task<IReadOnlyList<ChannelModel>> ListAsync(
        Guid? viewerUserId,
        CancellationToken cancellationToken) =>
        _repository.ListAsync(
            viewerUserId,
            cancellationToken);

    public Task<ChannelModel?> GetAsync(
        Guid channelId,
        Guid? viewerUserId,
        CancellationToken cancellationToken) =>
        _repository.GetAsync(
            channelId,
            viewerUserId,
            cancellationToken);

    public async Task<ChannelModel?> GetOwnedAsync(
        Guid ownerId,
        CancellationToken cancellationToken)
    {
        var channel = await _repository.FindByOwnerIdAsync(
            ownerId,
            cancellationToken);

        return channel is null
            ? null
            : await _repository.GetAsync(
                channel.Id,
                ownerId,
                cancellationToken);
    }

    public async Task<ChannelResult> EnsureOwnedAsync(
        Guid ownerId,
        CancellationToken cancellationToken)
    {
        var existing = await GetOwnedAsync(
            ownerId,
            cancellationToken);

        if (existing is not null)
        {
            return ChannelResult.Success(existing);
        }

        var user = await _userRepository.GetUserByIdAsync(
            ownerId,
            cancellationToken);

        if (user is null)
        {
            return ChannelResult.Failure(
                ChannelError.OwnerNotFound);
        }

        var handle = user.UserName.Trim().TrimStart('@');

        if (await _repository.HandleExistsAsync(
                handle,
                null,
                cancellationToken))
        {
            handle = $"{handle}-{ownerId:N}"[..Math.Min(
                handle.Length + 9,
                64)];
        }

        var channel = new Channel
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Name = string.IsNullOrWhiteSpace(user.DisplayName)
                ? user.UserName
                : user.DisplayName.Trim(),
            Handle = handle,
            Description = user.Bio.Trim(),
            AvatarPath = user.AvatarPath,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _repository.AddChannel(channel);
        await _repository.SaveChangesAsync(cancellationToken);

        var created = await _repository.GetAsync(
            channel.Id,
            ownerId,
            cancellationToken);

        return created is null
            ? ChannelResult.Failure(ChannelError.NotFound)
            : ChannelResult.Success(created);
    }

    public async Task<ChannelResult> CreateAsync(
        Guid ownerId,
        SaveChannelCommand command,
        CancellationToken cancellationToken)
    {
        var owner = await _userRepository.GetUserByIdAsync(
            ownerId,
            cancellationToken);

        if (owner is null)
        {
            return ChannelResult.Failure(
                ChannelError.OwnerNotFound);
        }

        if (await _repository.FindByOwnerIdAsync(
                ownerId,
                cancellationToken) is not null)
        {
            return ChannelResult.Failure(
                ChannelError.AlreadyOwnsChannel);
        }

        var validationError = await ValidateCommandAsync(
            command,
            null,
            cancellationToken);

        if (validationError != ChannelError.None)
        {
            return ChannelResult.Failure(validationError);
        }

        var channel = new Channel
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            Name = command.Name.Trim(),
            Handle = NormalizeHandle(command.Handle),
            Description = command.Description.Trim(),
            AvatarPath = owner.AvatarPath,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _repository.AddChannel(channel);
        await _repository.SaveChangesAsync(cancellationToken);

        var created = await _repository.GetAsync(
            channel.Id,
            ownerId,
            cancellationToken);

        return created is null
            ? ChannelResult.Failure(ChannelError.NotFound)
            : ChannelResult.Success(created);
    }

    public async Task<ChannelResult> UpdateAsync(
        Guid ownerId,
        Guid channelId,
        SaveChannelCommand command,
        CancellationToken cancellationToken)
    {
        var channel = await _repository.FindByIdAsync(
            channelId,
            cancellationToken);

        if (channel is null)
        {
            return ChannelResult.Failure(ChannelError.NotFound);
        }

        if (channel.OwnerId != ownerId)
        {
            return ChannelResult.Failure(ChannelError.Forbidden);
        }

        var validationError = await ValidateCommandAsync(
            command,
            channelId,
            cancellationToken);

        if (validationError != ChannelError.None)
        {
            return ChannelResult.Failure(validationError);
        }

        channel.Name = command.Name.Trim();
        channel.Handle = NormalizeHandle(command.Handle);
        channel.Description = command.Description.Trim();

        await _repository.SaveChangesAsync(cancellationToken);

        var updated = await _repository.GetAsync(
            channel.Id,
            ownerId,
            cancellationToken);

        return updated is null
            ? ChannelResult.Failure(ChannelError.NotFound)
            : ChannelResult.Success(updated);
    }

    public Task<IReadOnlyList<ChannelModel>> ListSubscriptionsAsync(
        Guid subscriberId,
        CancellationToken cancellationToken) =>
        _repository.ListSubscriptionsAsync(
            subscriberId,
            cancellationToken);

    public async Task<ChannelError> SubscribeAsync(
        Guid subscriberId,
        Guid channelId,
        CancellationToken cancellationToken)
    {
        var channel = await _repository.FindByIdAsync(
            channelId,
            cancellationToken);

        if (channel is null)
        {
            return ChannelError.NotFound;
        }

        if (channel.OwnerId == subscriberId)
        {
            return ChannelError.CannotSubscribeOwnChannel;
        }

        var existing = await _repository.FindSubscriptionAsync(
            subscriberId,
            channelId,
            cancellationToken);

        if (existing is not null)
        {
            return ChannelError.None;
        }

        _repository.AddSubscription(
            new Subscription
            {
                SubscriberId = subscriberId,
                ChannelId = channelId,
                CreatedAt = DateTimeOffset.UtcNow
            });

        await _repository.SaveChangesAsync(cancellationToken);
        return ChannelError.None;
    }

    public async Task<ChannelError> UnsubscribeAsync(
        Guid subscriberId,
        Guid channelId,
        CancellationToken cancellationToken)
    {
        var channel = await _repository.FindByIdAsync(
            channelId,
            cancellationToken);

        if (channel is null)
        {
            return ChannelError.NotFound;
        }

        var subscription = await _repository.FindSubscriptionAsync(
            subscriberId,
            channelId,
            cancellationToken);

        if (subscription is null)
        {
            return ChannelError.None;
        }

        _repository.RemoveSubscription(subscription);
        await _repository.SaveChangesAsync(cancellationToken);

        return ChannelError.None;
    }

    private async Task<ChannelError> ValidateCommandAsync(
        SaveChannelCommand command,
        Guid? excludingChannelId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            return ChannelError.NameRequired;
        }

        var handle = NormalizeHandle(command.Handle);

        if (string.IsNullOrWhiteSpace(handle))
        {
            return ChannelError.HandleRequired;
        }

        if (await _repository.HandleExistsAsync(
                handle,
                excludingChannelId,
                cancellationToken))
        {
            return ChannelError.HandleTaken;
        }

        return ChannelError.None;
    }

    private static string NormalizeHandle(string handle) =>
        handle.Trim().TrimStart('@').ToLowerInvariant();
}
