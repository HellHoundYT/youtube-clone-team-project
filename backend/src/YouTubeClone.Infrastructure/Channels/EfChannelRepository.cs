using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Features.Channels;
using YouTubeClone.Domain.Channels;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.Channels;

public sealed class EfChannelRepository : IChannelRepository
{
    private readonly AppDbContext _db;

    public EfChannelRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ChannelModel>> ListAsync(
        Guid? subscriberId,
        CancellationToken cancellationToken) =>
        await Query(subscriberId)
            .OrderBy(channel => channel.Name)
            .ToListAsync(cancellationToken);

    public Task<ChannelModel?> GetAsync(
        Guid channelId,
        Guid? subscriberId,
        CancellationToken cancellationToken) =>
        Query(subscriberId)
            .SingleOrDefaultAsync(
                channel => channel.Id == channelId,
                cancellationToken);

    public async Task<IReadOnlyList<ChannelModel>> ListSubscriptionsAsync(
        Guid subscriberId,
        CancellationToken cancellationToken) =>
        await Query(subscriberId)
            .Where(channel => channel.IsSubscribed)
            .OrderBy(channel => channel.Name)
            .ToListAsync(cancellationToken);

    public Task<Channel?> FindByIdAsync(
        Guid channelId,
        CancellationToken cancellationToken) =>
        _db.Channels.SingleOrDefaultAsync(
            channel => channel.Id == channelId,
            cancellationToken);

    public Task<Channel?> FindByOwnerIdAsync(
        Guid ownerId,
        CancellationToken cancellationToken) =>
        _db.Channels.SingleOrDefaultAsync(
            channel => channel.OwnerId == ownerId,
            cancellationToken);

    public Task<bool> HandleExistsAsync(
        string handle,
        Guid? excludingChannelId,
        CancellationToken cancellationToken) =>
        _db.Channels.AnyAsync(
            channel =>
                channel.Handle == handle &&
                (!excludingChannelId.HasValue ||
                 channel.Id != excludingChannelId.Value),
            cancellationToken);

    public Task<Subscription?> FindSubscriptionAsync(
        Guid subscriberId,
        Guid channelId,
        CancellationToken cancellationToken) =>
        _db.Subscriptions.SingleOrDefaultAsync(
            subscription =>
                subscription.SubscriberId == subscriberId &&
                subscription.ChannelId == channelId,
            cancellationToken);

    public void AddChannel(Channel channel)
    {
        _db.Channels.Add(channel);
    }

    public void AddSubscription(Subscription subscription)
    {
        _db.Subscriptions.Add(subscription);
    }

    public void RemoveSubscription(Subscription subscription)
    {
        _db.Subscriptions.Remove(subscription);
    }

    public Task SaveChangesAsync(
        CancellationToken cancellationToken) =>
        _db.SaveChangesAsync(cancellationToken);

    private IQueryable<ChannelModel> Query(Guid? subscriberId) =>
        _db.Channels.Select(
            channel =>
                new ChannelModel(
                    channel.Id,
                    channel.OwnerId,
                    channel.Name,
                    "@" + channel.Handle,
                    channel.Description,
                    channel.AvatarPath,
                    channel.BannerPath,
                    _db.Subscriptions.Count(
                        subscription =>
                            subscription.ChannelId == channel.Id),
                    subscriberId.HasValue &&
                    _db.Subscriptions.Any(
                        subscription =>
                            subscription.SubscriberId == subscriberId.Value &&
                            subscription.ChannelId == channel.Id)));
}
