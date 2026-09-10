namespace YouTubeClone.Api.DTOs.Playlists;

public sealed class CreatePlaylistRequestDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}

public sealed class UpdatePlaylistRequestDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
}

public sealed record PlaylistDto(
    Guid Id,
    string Title,
    string Description,
    DateTimeOffset CreatedAt,
    IReadOnlyList<Guid> VideoIds);
