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

        db.Users.Add(new User
        {
            Id = ownerId,
            Email = $"owner-{ownerId:N}@example.com",
            UserName = $"owner-{ownerId:N}",
            DisplayName = "Regression Owner",
            Bio = string.Empty,
            PasswordHash = "test-hash",
            CreatedAt = DateTimeOffset.UtcNow
        });

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
}
