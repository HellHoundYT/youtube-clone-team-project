using YouTubeClone.Domain.Comments;

namespace YouTubeClone.Application.Features.Comments;

public sealed record CommentModel(
    Guid Id,
    Guid VideoId,
    Guid AuthorId,
    Guid? ParentCommentId,
    string AuthorName,
    string? AuthorAvatarPath,
    string Text,
    DateTimeOffset CreatedAt,
    int Likes,
    int Dislikes,
    CommentReactionKind? ViewerReaction,
    IReadOnlyList<CommentModel> Replies);

public sealed record AddCommentCommand(
    Guid VideoId,
    Guid AuthorId,
    string Text,
    Guid? ParentCommentId);

public enum CommentError
{
    None,
    NotFound,
    TextRequired,
    TextTooLong,
    InvalidParent
}

public sealed record CommentResult(
    CommentModel? Comment,
    CommentError Error)
{
    public static CommentResult Success(CommentModel comment) =>
        new(comment, CommentError.None);

    public static CommentResult Failure(CommentError error) =>
        new(null, error);
}
