using System.ComponentModel.DataAnnotations;

namespace YouTubeClone.Api.DTOs.Comments;

public sealed class AddCommentRequestDto
{
    [Required, MaxLength(500)]
    public string Text { get; init; } = string.Empty;

    public Guid? ParentCommentId { get; init; }
}

public sealed class ToggleCommentReactionRequestDto
{
    [Required]
    public string Reaction { get; init; } = string.Empty;
}

public sealed record CommentResponseDto(
    Guid Id,
    Guid VideoId,
    Guid AuthorId,
    Guid? ParentCommentId,
    string Author,
    string? AuthorAvatarUrl,
    string Text,
    DateTimeOffset CreatedAt,
    int Likes,
    int Dislikes,
    string? Reaction,
    IReadOnlyList<CommentResponseDto> Replies);
