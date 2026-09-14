namespace YouTubeClone.Application.Features.Channels;

public interface IChannelService
{
    Task<IReadOnlyList<ChannelModel>> ListAsync(
        Guid? viewerUserId,
        CancellationToken cancellationToken);

    Task<ChannelModel?> GetAsync(
        Guid channelId,
        Guid? viewerUserId,
        CancellationToken cancellationToken);

    Task<ChannelModel?> GetOwnedAsync(
        Guid ownerId,
        CancellationToken cancellationToken);

    Task<ChannelResult> EnsureOwnedAsync(
        Guid ownerId,
        CancellationToken cancellationToken);

    Task<ChannelResult> CreateAsync(
        Guid ownerId,
        SaveChannelCommand command,
        CancellationToken cancellationToken);

    Task<ChannelResult> UpdateAsync(
        Guid ownerId,
        Guid channelId,
        SaveChannelCommand command,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ChannelModel>> ListSubscriptionsAsync(
        Guid subscriberId,
        CancellationToken cancellationToken);

    Task<ChannelError> SubscribeAsync(
        Guid subscriberId,
        Guid channelId,
        CancellationToken cancellationToken);

    Task<ChannelError> UnsubscribeAsync(
        Guid subscriberId,
        Guid channelId,
        CancellationToken cancellationToken);
}
