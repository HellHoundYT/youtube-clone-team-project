using YouTubeClone.Domain.Comments;

namespace YouTubeClone.Application.Features.Comments;

public interface ICommentService
{
    Task<IReadOnlyList<CommentModel>> ListAsync(
        Guid videoId,
        Guid? viewerUserId,
        int page,
        int pageSize,
        CommentSort sort,
        CancellationToken cancellationToken);

    Task<CommentResult> AddAsync(
        AddCommentCommand command,
        CancellationToken cancellationToken);

    Task<CommentResult> UpdateAsync(
        UpdateCommentCommand command,
        CancellationToken cancellationToken);

    Task<CommentError> DeleteAsync(
        Guid commentId,
        Guid authorId,
        CancellationToken cancellationToken);

    Task<CommentResult> ToggleReactionAsync(
        Guid commentId,
        Guid userId,
        CommentReactionKind reaction,
        CancellationToken cancellationToken);
}
