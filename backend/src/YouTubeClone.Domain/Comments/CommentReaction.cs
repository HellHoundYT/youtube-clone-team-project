namespace YouTubeClone.Domain.Comments;

public enum CommentReactionKind
{
    Like = 1,
    Dislike = 2
}

public sealed class CommentReaction
{
    public Guid CommentId { get; set; }

    public Guid UserId { get; set; }

    public CommentReactionKind Kind { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public Comment? Comment { get; set; }
}
