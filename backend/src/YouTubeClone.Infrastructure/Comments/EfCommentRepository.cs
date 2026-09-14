using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Features.Comments;
using YouTubeClone.Domain.Comments;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.Comments;

public sealed class EfCommentRepository : ICommentRepository
{
    private readonly AppDbContext _db;

    public EfCommentRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CommentModel>> ListAsync(
        Guid videoId,
        Guid? viewerUserId,
        CancellationToken cancellationToken)
    {
        var comments = await _db.Comments
            .AsNoTracking()
            .Include(comment => comment.Reactions)
            .Where(comment => comment.VideoId == videoId)
            .OrderBy(comment => comment.CreatedAt)
            .ToListAsync(cancellationToken);

        return await MapTreeAsync(
            comments,
            viewerUserId,
            cancellationToken);
    }

    public async Task<CommentModel?> GetAsync(
        Guid commentId,
        Guid? viewerUserId,
        CancellationToken cancellationToken)
    {
        var comment = await _db.Comments
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == commentId,
                cancellationToken);

        if (comment is null)
        {
            return null;
        }

        var tree = await ListAsync(
            comment.VideoId,
            viewerUserId,
            cancellationToken);

        foreach (var root in tree)
        {
            if (root.Id == commentId)
            {
                return root;
            }

            var reply = root.Replies.FirstOrDefault(
                item => item.Id == commentId);

            if (reply is not null)
            {
                return reply;
            }
        }

        return null;
    }

    public Task<Comment?> FindByIdAsync(
        Guid commentId,
        CancellationToken cancellationToken) =>
        _db.Comments.FirstOrDefaultAsync(
            item => item.Id == commentId,
            cancellationToken);

    public Task<CommentReaction?> FindReactionAsync(
        Guid commentId,
        Guid userId,
        CancellationToken cancellationToken) =>
        _db.CommentReactions.FirstOrDefaultAsync(
            item =>
                item.CommentId == commentId &&
                item.UserId == userId,
            cancellationToken);

    public void AddComment(Comment comment)
    {
        _db.Comments.Add(comment);
    }

    public async Task RemoveCommentTreeAsync(
        Comment comment,
        CancellationToken cancellationToken)
    {
        if (!comment.ParentCommentId.HasValue)
        {
            var replies = await _db.Comments
                .Where(item => item.ParentCommentId == comment.Id)
                .ToListAsync(cancellationToken);

            if (replies.Count > 0)
            {
                _db.Comments.RemoveRange(replies);
            }
        }

        _db.Comments.Remove(comment);
    }

    public void AddReaction(CommentReaction reaction)
    {
        _db.CommentReactions.Add(reaction);
    }

    public void RemoveReaction(CommentReaction reaction)
    {
        _db.CommentReactions.Remove(reaction);
    }

    public async Task SaveChangesAsync(
        CancellationToken cancellationToken)
    {
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<CommentModel>> MapTreeAsync(
        IReadOnlyList<Comment> comments,
        Guid? viewerUserId,
        CancellationToken cancellationToken)
    {
        if (comments.Count == 0)
        {
            return [];
        }

        var authorIds = comments
            .Select(comment => comment.AuthorId)
            .Distinct()
            .ToList();

        var authors = await _db.Users
            .AsNoTracking()
            .Where(user => authorIds.Contains(user.Id))
            .Select(user => new
            {
                user.Id,
                user.DisplayName,
                user.UserName,
                user.AvatarPath
            })
            .ToDictionaryAsync(
                user => user.Id,
                cancellationToken);

        CommentModel Map(Comment comment)
        {
            authors.TryGetValue(
                comment.AuthorId,
                out var author);

            var viewerReaction = viewerUserId.HasValue
                ? comment.Reactions
                    .FirstOrDefault(
                        item => item.UserId == viewerUserId.Value)
                    ?.Kind
                : null;

            return new CommentModel(
                comment.Id,
                comment.VideoId,
                comment.AuthorId,
                comment.ParentCommentId,
                author?.DisplayName ?? author?.UserName ?? "AMTLIS User",
                author?.AvatarPath,
                comment.Text,
                comment.CreatedAt,
                comment.Reactions.Count(item =>
                    item.Kind == CommentReactionKind.Like),
                comment.Reactions.Count(item =>
                    item.Kind == CommentReactionKind.Dislike),
                viewerReaction,
                []);
        }

        var replyLookup = comments
            .Where(comment => comment.ParentCommentId.HasValue)
            .GroupBy(comment => comment.ParentCommentId!.Value)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<CommentModel>)group
                    .OrderBy(comment => comment.CreatedAt)
                    .Select(Map)
                    .ToList());

        return comments
            .Where(comment => !comment.ParentCommentId.HasValue)
            .OrderByDescending(comment => comment.CreatedAt)
            .Select(comment =>
            {
                var model = Map(comment);
                return model with
                {
                    Replies = replyLookup.TryGetValue(
                        comment.Id,
                        out var replies)
                        ? replies
                        : []
                };
            })
            .ToList();
    }
}
