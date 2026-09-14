using System.ComponentModel.DataAnnotations;

namespace YouTubeClone.Api.DTOs.Playlists;

public sealed class SavePlaylistRequestDto
{
    [Required, MaxLength(80)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(300)]
    public string Description { get; init; } = string.Empty;
}

public sealed record PlaylistResponseDto(
    Guid Id,
    string Title,
    string Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<Guid> VideoIds);
