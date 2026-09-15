using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using YouTubeClone.Domain.Channels;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Channels;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Api.Tests;

public sealed class ChannelRepositoryRelationalTests
{
    [Fact]
    public async Task GetAsync_filters_channel_entity_before_projection()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var ownerId = Guid.NewGuid();
        var channelId = Guid.NewGuid();

        db.Users.Add(CreateUser(ownerId, "owner"));

        db.Channels.Add(new Channel
        {
            Id = channelId,
            OwnerId = ownerId,
            Name = "Regression Channel",
            Handle = $"regression-{channelId:N}",
            Description = string.Empty,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync();

        var repository = new EfChannelRepository(db);

        var channel = await repository.GetAsync(
            channelId,
            subscriberId: null,
            CancellationToken.None);

        Assert.NotNull(channel);
        Assert.Equal(channelId, channel.Id);
        Assert.Equal(ownerId, channel.OwnerId);
        Assert.Equal("Regression Channel", channel.Name);
    }

    [Fact]
    public async Task ListSubscriptionsAsync_filters_entities_before_projection()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var ownerId = Guid.NewGuid();
        var subscriberId = Guid.NewGuid();
        var channelId = Guid.NewGuid();

        db.Users.AddRange(
            CreateUser(ownerId, "owner"),
            CreateUser(subscriberId, "subscriber"));

        db.Channels.Add(new Channel
        {
            Id = channelId,
            OwnerId = ownerId,
            Name = "Subscribed Channel",
            Handle = $"subscribed-{channelId:N}",
            Description = string.Empty,
            CreatedAt = DateTimeOffset.UtcNow
        });

        db.Subscriptions.Add(new Subscription
        {
            SubscriberId = subscriberId,
            ChannelId = channelId,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync();

        var repository = new EfChannelRepository(db);

        var subscriptions = await repository.ListSubscriptionsAsync(
            subscriberId,
            CancellationToken.None);

        var subscription = Assert.Single(
            subscriptions,
            channel => channel.Id == channelId);

        Assert.True(subscription.IsSubscribed);
        Assert.Equal(1, subscription.SubscriberCount);
    }

    [Fact]
    public async Task GetAsync_seeds_every_demo_streamer_channel()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();

        var repository = new EfChannelRepository(db);
        var streamChannelIds = new[]
        {
            Guid.Parse("81111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("82222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Guid.Parse("83333333-cccc-cccc-cccc-cccccccccccc"),
            Guid.Parse("84444444-dddd-dddd-dddd-dddddddddddd")
        };

        foreach (var channelId in streamChannelIds)
        {
            var channel = await repository.GetAsync(
                channelId,
                subscriberId: null,
                CancellationToken.None);

            Assert.NotNull(channel);
            Assert.Equal(channelId, channel.Id);
        }
    }

    private static User CreateUser(
        Guid id,
        string prefix) =>
        new()
        {
            Id = id,
            Email = $"{prefix}-{id:N}@example.com",
            UserName = $"{prefix}-{id:N}",
            DisplayName = $"Regression {prefix}",
            Bio = string.Empty,
            PasswordHash = "test-hash",
            CreatedAt = DateTimeOffset.UtcNow
        };
}
