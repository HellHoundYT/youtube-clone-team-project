using YouTubeClone.Domain.Comments;

namespace YouTubeClone.Application.Features.Comments;

public interface ICommentRepository
{
    Task<IReadOnlyList<CommentModel>> ListAsync(
        Guid videoId,
        Guid? viewerUserId,
        CancellationToken cancellationToken);

    Task<CommentModel?> GetAsync(
        Guid commentId,
        Guid? viewerUserId,
        CancellationToken cancellationToken);

    Task<Comment?> FindByIdAsync(
        Guid commentId,
        CancellationToken cancellationToken);

    Task<CommentReaction?> FindReactionAsync(
        Guid commentId,
        Guid userId,
        CancellationToken cancellationToken);

    void AddComment(Comment comment);

    Task RemoveCommentTreeAsync(
        Comment comment,
        CancellationToken cancellationToken);

    void AddReaction(CommentReaction reaction);

    void RemoveReaction(CommentReaction reaction);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);
}
