using Microsoft.EntityFrameworkCore;
using YouTubeClone.Domain.Channels;
using YouTubeClone.Domain.Comments;
using YouTubeClone.Domain.Users;

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
    }
}
