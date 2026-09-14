using YouTubeClone.Domain.Channels;

namespace YouTubeClone.Application.Features.Channels;

public interface IChannelRepository
{
    Task<IReadOnlyList<ChannelModel>> ListAsync(
        Guid? subscriberId,
        CancellationToken cancellationToken);

    Task<ChannelModel?> GetAsync(
        Guid channelId,
        Guid? subscriberId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ChannelModel>> ListSubscriptionsAsync(
        Guid subscriberId,
        CancellationToken cancellationToken);

    Task<Channel?> FindByIdAsync(
        Guid channelId,
        CancellationToken cancellationToken);

    Task<Channel?> FindByOwnerIdAsync(
        Guid ownerId,
        CancellationToken cancellationToken);

    Task<bool> HandleExistsAsync(
        string handle,
        Guid? excludingChannelId,
        CancellationToken cancellationToken);

    Task<Subscription?> FindSubscriptionAsync(
        Guid subscriberId,
        Guid channelId,
        CancellationToken cancellationToken);

    void AddChannel(Channel channel);

    void AddSubscription(Subscription subscription);

    void RemoveSubscription(Subscription subscription);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}
