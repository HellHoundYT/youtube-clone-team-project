using Microsoft.EntityFrameworkCore;
using YouTubeClone.Domain.Users;
using YouTubeClone.Domain.Channels;

namespace YouTubeClone.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Channel> Channels => Set<Channel>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Email).HasMaxLength(256).IsRequired();
            entity.Property(user => user.UserName).HasMaxLength(64).IsRequired();
            entity.Property(user => user.DisplayName).HasMaxLength(100).IsRequired();
            entity.Property(user => user.Bio).HasMaxLength(240).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(512).IsRequired();
            entity.HasIndex(user => user.Email).IsUnique();
            entity.HasIndex(user => user.UserName).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(token => token.Id);
            entity.Property(token => token.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(token => token.TokenHash).IsUnique();
            entity.HasOne(token => token.User)
                .WithMany(user => user.RefreshTokens)
                .HasForeignKey(token => token.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Channel>(entity =>
        {
            entity.ToTable("Channels");
            entity.HasKey(channel => channel.Id);
            entity.Property(channel => channel.Name).HasMaxLength(100).IsRequired();
            entity.Property(channel => channel.Handle).HasMaxLength(64).IsRequired();
            entity.Property(channel => channel.Description).HasMaxLength(1000).IsRequired();
            entity.HasIndex(channel => channel.Handle).IsUnique();
            entity.HasOne<User>().WithMany().HasForeignKey(channel => channel.OwnerId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.ToTable("Subscriptions");
            entity.HasKey(subscription => new { subscription.SubscriberId, subscription.ChannelId });
            entity.HasOne<User>().WithMany().HasForeignKey(subscription => subscription.SubscriberId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(subscription => subscription.Channel).WithMany().HasForeignKey(subscription => subscription.ChannelId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
