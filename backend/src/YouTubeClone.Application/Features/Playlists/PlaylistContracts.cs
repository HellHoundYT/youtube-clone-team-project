namespace YouTubeClone.Application.Features.Playlists;

public sealed record PlaylistModel(
    Guid Id,
    Guid OwnerId,
    string Title,
    string Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record SavePlaylistCommand(
    string Title,
    string Description);

public enum PlaylistError
{
    None,
    NotFound,
    TitleRequired,
    TitleTooLong,
    DescriptionTooLong
}

public sealed record PlaylistResult(
    PlaylistModel? Playlist,
    PlaylistError Error)
{
    public static PlaylistResult Success(PlaylistModel playlist) =>
        new(playlist, PlaylistError.None);

    public static PlaylistResult Failure(PlaylistError error) =>
        new(null, error);
}
