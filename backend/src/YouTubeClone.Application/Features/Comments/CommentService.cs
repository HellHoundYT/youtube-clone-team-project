using YouTubeClone.Domain.Comments;

namespace YouTubeClone.Application.Features.Comments;

public sealed class CommentService : ICommentService
{
    private const int MaxTextLength = 500;

    private readonly ICommentRepository _repository;

    public CommentService(ICommentRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<CommentModel>> ListAsync(
        Guid videoId,
        Guid? viewerUserId,
        CancellationToken cancellationToken) =>
        _repository.ListAsync(
            videoId,
            viewerUserId,
            cancellationToken);

    public async Task<CommentResult> AddAsync(
        AddCommentCommand command,
        CancellationToken cancellationToken)
    {
        var text = command.Text.Trim();

        if (string.IsNullOrWhiteSpace(text))
        {
            return CommentResult.Failure(
                CommentError.TextRequired);
        }

        if (text.Length > MaxTextLength)
        {
            return CommentResult.Failure(
                CommentError.TextTooLong);
        }

        if (command.ParentCommentId.HasValue)
        {
            var parent = await _repository.FindByIdAsync(
                command.ParentCommentId.Value,
                cancellationToken);

            if (parent is null ||
                parent.VideoId != command.VideoId ||
                parent.ParentCommentId.HasValue)
            {
                return CommentResult.Failure(
                    CommentError.InvalidParent);
            }
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            VideoId = command.VideoId,
            AuthorId = command.AuthorId,
            ParentCommentId = command.ParentCommentId,
            Text = text,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _repository.AddComment(comment);
        await _repository.SaveChangesAsync(cancellationToken);

        var created = await _repository.GetAsync(
            comment.Id,
            command.AuthorId,
            cancellationToken);

        return created is null
            ? CommentResult.Failure(CommentError.NotFound)
            : CommentResult.Success(created);
    }

    public async Task<CommentResult> ToggleReactionAsync(
        Guid commentId,
        Guid userId,
        CommentReactionKind reaction,
        CancellationToken cancellationToken)
    {
        var comment = await _repository.FindByIdAsync(
            commentId,
            cancellationToken);

        if (comment is null)
        {
            return CommentResult.Failure(CommentError.NotFound);
        }

        var existing = await _repository.FindReactionAsync(
            commentId,
            userId,
            cancellationToken);

        if (existing is null)
        {
            _repository.AddReaction(
                new CommentReaction
                {
                    CommentId = commentId,
                    UserId = userId,
                    Kind = reaction,
                    UpdatedAt = DateTimeOffset.UtcNow
                });
        }
        else if (existing.Kind == reaction)
        {
            _repository.RemoveReaction(existing);
        }
        else
        {
            existing.Kind = reaction;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _repository.SaveChangesAsync(cancellationToken);

        var updated = await _repository.GetAsync(
            commentId,
            userId,
            cancellationToken);

        return updated is null
            ? CommentResult.Failure(CommentError.NotFound)
            : CommentResult.Success(updated);
    }
}
