namespace YouTubeClone.Domain.Playlists;

public sealed class PlaylistVideo
{
    public Guid PlaylistId { get; set; }

    public Playlist? Playlist { get; set; }

    public Guid VideoId { get; set; }

    public DateTimeOffset AddedAt { get; set; }
}
