using Microsoft.EntityFrameworkCore;
using YouTubeClone.Domain.Channels;
using YouTubeClone.Domain.Comments;
using YouTubeClone.Domain.Favorites;
using YouTubeClone.Domain.History;
using YouTubeClone.Domain.Playlists;
using YouTubeClone.Domain.Users;
using YouTubeClone.Domain.Videos;

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

    public DbSet<Comment> Comments => Set<Comment>();

    public DbSet<CommentReaction> CommentReactions => Set<CommentReaction>();

    public DbSet<Playlist> Playlists => Set<Playlist>();

    public DbSet<PlaylistVideo> PlaylistVideos => Set<PlaylistVideo>();

    public DbSet<Video> Videos => Set<Video>();

    public DbSet<WatchHistoryEntry> WatchHistoryEntries => Set<WatchHistoryEntry>();

    public DbSet<WatchHistoryPreference> WatchHistoryPreferences => Set<WatchHistoryPreference>();

    public DbSet<FavoriteEntry> FavoriteEntries => Set<FavoriteEntry>();

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
            entity.Property(user => user.AvatarPath).HasMaxLength(512);
            entity.Property(user => user.ThemeId).HasMaxLength(64);
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
            entity.Property(channel => channel.AvatarPath).HasMaxLength(512);
            entity.Property(channel => channel.BannerPath).HasMaxLength(512);
            entity.HasIndex(channel => channel.Handle).IsUnique();
            entity.HasIndex(channel => channel.OwnerId).IsUnique();
            entity.HasOne<User>()
                .WithOne()
                .HasForeignKey<Channel>(channel => channel.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.ToTable("Subscriptions");
            entity.HasKey(subscription => new
            {
                subscription.SubscriberId,
                subscription.ChannelId
            });
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(subscription => subscription.SubscriberId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(subscription => subscription.Channel)
                .WithMany()
                .HasForeignKey(subscription => subscription.ChannelId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.ToTable("Comments");
            entity.HasKey(comment => comment.Id);
            entity.Property(comment => comment.Text).HasMaxLength(500).IsRequired();
            entity.HasIndex(comment => comment.VideoId);
            entity.HasIndex(comment => comment.AuthorId);
            entity.HasIndex(comment => comment.ParentCommentId);
        });

        modelBuilder.Entity<CommentReaction>(entity =>
        {
            entity.ToTable("CommentReactions");
            entity.HasKey(reaction => new
            {
                reaction.CommentId,
                reaction.UserId
            });
            entity.Property(reaction => reaction.Kind).IsRequired();
            entity.HasOne(reaction => reaction.Comment)
                .WithMany(comment => comment.Reactions)
                .HasForeignKey(reaction => reaction.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(reaction => reaction.UserId);
        });

        modelBuilder.Entity<Playlist>(entity =>
        {
            entity.ToTable("Playlists");
            entity.HasKey(playlist => playlist.Id);
            entity.Property(playlist => playlist.Title).HasMaxLength(80).IsRequired();
            entity.Property(playlist => playlist.Description).HasMaxLength(300).IsRequired();
            entity.HasIndex(playlist => playlist.OwnerId);
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(playlist => playlist.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlaylistVideo>(entity =>
        {
            entity.ToTable("PlaylistVideos");
            entity.HasKey(item => new
            {
                item.PlaylistId,
                item.VideoId
            });
            entity.HasOne(item => item.Playlist)
                .WithMany(playlist => playlist.Videos)
                .HasForeignKey(item => item.PlaylistId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(item => item.VideoId);
        });

        modelBuilder.Entity<Video>(entity =>
        {
            entity.ToTable("Videos");
            entity.HasKey(video => video.Id);
            entity.Property(video => video.ChannelName).HasMaxLength(100).IsRequired();
            entity.Property(video => video.ChannelAvatarPath).HasMaxLength(512);
            entity.Property(video => video.Category).HasMaxLength(100);
            entity.Property(video => video.CategorySlug).HasMaxLength(100);
            entity.Property(video => video.Title).HasMaxLength(200).IsRequired();
            entity.Property(video => video.Description).HasMaxLength(5000);
            entity.Property(video => video.VideoPath).HasMaxLength(512).IsRequired();
            entity.Property(video => video.ThumbnailPath).HasMaxLength(512);
            entity.Property(video => video.Visibility).HasMaxLength(32).IsRequired();
            entity.HasIndex(video => video.ChannelId);
            entity.HasIndex(video => video.CategorySlug);
            entity.HasIndex(video => video.PublishedAt);
        });

        modelBuilder.Entity<WatchHistoryEntry>(entity =>
        {
            entity.ToTable("WatchHistoryEntries");
            entity.HasKey(entry => new
            {
                entry.UserId,
                entry.VideoId
            });
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(entry => entry.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(entry => new
            {
                entry.UserId,
                entry.LastWatchedAt
            });
        });

        modelBuilder.Entity<WatchHistoryPreference>(entity =>
        {
            entity.ToTable("WatchHistoryPreferences");
            entity.HasKey(preference => preference.UserId);
            entity.HasOne<User>()
                .WithOne()
                .HasForeignKey<WatchHistoryPreference>(preference => preference.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FavoriteEntry>(entity =>
        {
            entity.ToTable("FavoriteEntries");
            entity.HasKey(entry => new
            {
                entry.UserId,
                entry.VideoId
            });
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(entry => entry.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(entry => new
            {
                entry.UserId,
                entry.CreatedAt
            });
        });
    }
}
