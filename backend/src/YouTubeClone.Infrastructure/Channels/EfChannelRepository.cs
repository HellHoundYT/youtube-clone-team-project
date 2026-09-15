using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Features.Channels;
using YouTubeClone.Domain.Channels;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.Channels;

public sealed class EfChannelRepository : IChannelRepository
{
    private static readonly SemaphoreSlim SeedLock =
        new(1, 1);

    private readonly AppDbContext _db;
    private bool _seedChecked;

    public EfChannelRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ChannelModel>> ListAsync(
        Guid? subscriberId,
        CancellationToken cancellationToken)
    {
        await EnsureSeedDataAsync(cancellationToken);

        return await Query(subscriberId)
            .OrderBy(channel => channel.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<ChannelModel?> GetAsync(
        Guid channelId,
        Guid? subscriberId,
        CancellationToken cancellationToken)
    {
        await EnsureSeedDataAsync(cancellationToken);

        return await Project(
                _db.Channels.Where(
                    channel => channel.Id == channelId),
                subscriberId)
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ChannelModel>> ListSubscriptionsAsync(
        Guid subscriberId,
        CancellationToken cancellationToken)
    {
        await EnsureSeedDataAsync(cancellationToken);

        var subscribedChannels =
            _db.Channels.Where(
                channel =>
                    _db.Subscriptions.Any(
                        subscription =>
                            subscription.SubscriberId == subscriberId &&
                            subscription.ChannelId == channel.Id));

        return await Project(
                subscribedChannels,
                subscriberId)
            .OrderBy(channel => channel.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Channel?> FindByIdAsync(
        Guid channelId,
        CancellationToken cancellationToken)
    {
        await EnsureSeedDataAsync(cancellationToken);

        return await _db.Channels.SingleOrDefaultAsync(
            channel => channel.Id == channelId,
            cancellationToken);
    }

    public async Task<Channel?> FindByOwnerIdAsync(
        Guid ownerId,
        CancellationToken cancellationToken)
    {
        await EnsureSeedDataAsync(cancellationToken);

        return await _db.Channels.SingleOrDefaultAsync(
            channel => channel.OwnerId == ownerId,
            cancellationToken);
    }

    public async Task<bool> HandleExistsAsync(
        string handle,
        Guid? excludingChannelId,
        CancellationToken cancellationToken)
    {
        await EnsureSeedDataAsync(cancellationToken);

        return await _db.Channels.AnyAsync(
            channel =>
                channel.Handle == handle &&
                (!excludingChannelId.HasValue ||
                 channel.Id != excludingChannelId.Value),
            cancellationToken);
    }

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
        Project(_db.Channels, subscriberId);

    private IQueryable<ChannelModel> Project(
        IQueryable<Channel> channels,
        Guid? subscriberId) =>
        channels.Select(
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

    private async Task EnsureSeedDataAsync(
        CancellationToken cancellationToken)
    {
        if (_seedChecked)
        {
            return;
        }

        await SeedLock.WaitAsync(cancellationToken);

        try
        {
            if (_seedChecked)
            {
                return;
            }

            var seedOwners = ChannelSeedData.CreateOwners();
            var seedChannels = ChannelSeedData.CreateChannels();
            var ownerIds = seedOwners.Select(owner => owner.Id).ToArray();
            var channelIds = seedChannels.Select(channel => channel.Id).ToArray();

            var existingOwnerIds = await _db.Users
                .Where(user => ownerIds.Contains(user.Id))
                .Select(user => user.Id)
                .ToListAsync(cancellationToken);

            var existingChannelIds = await _db.Channels
                .Where(channel => channelIds.Contains(channel.Id))
                .Select(channel => channel.Id)
                .ToListAsync(cancellationToken);

            var existingOwners = existingOwnerIds.ToHashSet();
            var existingChannels = existingChannelIds.ToHashSet();
            var missingOwners = seedOwners
                .Where(owner => !existingOwners.Contains(owner.Id))
                .ToList();
            var missingChannels = seedChannels
                .Where(channel => !existingChannels.Contains(channel.Id))
                .ToList();

            if (missingOwners.Count > 0)
            {
                _db.Users.AddRange(missingOwners);
            }

            if (missingChannels.Count > 0)
            {
                _db.Channels.AddRange(missingChannels);
            }

            if (missingOwners.Count > 0 || missingChannels.Count > 0)
            {
                await _db.SaveChangesAsync(cancellationToken);
            }

            _seedChecked = true;
        }
        finally
        {
            SeedLock.Release();
        }
    }
}
