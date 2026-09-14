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

    public async Task<IReadOnlyList<CommentModel>> ListAsync(
        Guid videoId,
        Guid? viewerUserId,
        int page,
        int pageSize,
        CommentSort sort,
        CancellationToken cancellationToken)
    {
        var comments = await _repository.ListAsync(
            videoId,
            viewerUserId,
            cancellationToken);

        IEnumerable<CommentModel> query =
            sort switch
            {
                CommentSort.Oldest =>
                    comments.OrderBy(comment => comment.CreatedAt),
                CommentSort.Top =>
                    comments
                        .OrderByDescending(comment => comment.Likes)
                        .ThenByDescending(comment => comment.CreatedAt),
                _ =>
                    comments.OrderByDescending(comment => comment.CreatedAt)
            };

        return query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
    }

    public async Task<CommentResult> AddAsync(
        AddCommentCommand command,
        CancellationToken cancellationToken)
    {
        var validation = ValidateText(command.Text);
        if (validation.Error != CommentError.None)
        {
            return CommentResult.Failure(validation.Error);
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
            Text = validation.Text,
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

    public async Task<CommentResult> UpdateAsync(
        UpdateCommentCommand command,
        CancellationToken cancellationToken)
    {
        var comment = await _repository.FindByIdAsync(
            command.CommentId,
            cancellationToken);

        if (comment is null)
        {
            return CommentResult.Failure(CommentError.NotFound);
        }

        if (comment.AuthorId != command.AuthorId)
        {
            return CommentResult.Failure(CommentError.Forbidden);
        }

        var validation = ValidateText(command.Text);
        if (validation.Error != CommentError.None)
        {
            return CommentResult.Failure(validation.Error);
        }

        comment.Text = validation.Text;
        await _repository.SaveChangesAsync(cancellationToken);

        var updated = await _repository.GetAsync(
            comment.Id,
            command.AuthorId,
            cancellationToken);

        return updated is null
            ? CommentResult.Failure(CommentError.NotFound)
            : CommentResult.Success(updated);
    }

    public async Task<CommentError> DeleteAsync(
        Guid commentId,
        Guid authorId,
        CancellationToken cancellationToken)
    {
        var comment = await _repository.FindByIdAsync(
            commentId,
            cancellationToken);

        if (comment is null)
        {
            return CommentError.NotFound;
        }

        if (comment.AuthorId != authorId)
        {
            return CommentError.Forbidden;
        }

        await _repository.RemoveCommentTreeAsync(
            comment,
            cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return CommentError.None;
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

    private static (string Text, CommentError Error) ValidateText(
        string source)
    {
        var text = source.Trim();

        if (string.IsNullOrWhiteSpace(text))
        {
            return (string.Empty, CommentError.TextRequired);
        }

        if (text.Length > MaxTextLength)
        {
            return (string.Empty, CommentError.TextTooLong);
        }

        return (text, CommentError.None);
    }
}
