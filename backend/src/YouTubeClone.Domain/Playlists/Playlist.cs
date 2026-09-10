using YouTubeClone.Domain.Users;

namespace YouTubeClone.Domain.Playlists;

public sealed class Playlist
{
    public Guid Id { get; set; }

    public Guid OwnerId { get; set; }

    public User? Owner { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<PlaylistVideo> Videos { get; set; } = new List<PlaylistVideo>();
}
