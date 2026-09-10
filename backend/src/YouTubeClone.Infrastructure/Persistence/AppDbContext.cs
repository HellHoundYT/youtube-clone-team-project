using Microsoft.EntityFrameworkCore;
using YouTubeClone.Domain.Playlists;
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

    public DbSet<Playlist> Playlists => Set<Playlist>();

    public DbSet<PlaylistVideo> PlaylistVideos => Set<PlaylistVideo>();

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

        modelBuilder.Entity<Playlist>(entity =>
        {
            entity.ToTable("Playlists");
            entity.HasKey(playlist => playlist.Id);
            entity.Property(playlist => playlist.Title).HasMaxLength(80).IsRequired();
            entity.Property(playlist => playlist.Description).HasMaxLength(300).IsRequired();
            entity.HasIndex(playlist => playlist.OwnerId);
            entity.HasOne(playlist => playlist.Owner)
                .WithMany(user => user.Playlists)
                .HasForeignKey(playlist => playlist.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlaylistVideo>(entity =>
        {
            entity.ToTable("PlaylistVideos");
            entity.HasKey(item => new { item.PlaylistId, item.VideoId });
            entity.HasOne(item => item.Playlist)
                .WithMany(playlist => playlist.Videos)
                .HasForeignKey(item => item.PlaylistId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
