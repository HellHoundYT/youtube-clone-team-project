namespace YouTubeClone.Domain.Comments;

public sealed class Comment
{
    public Guid Id { get; set; }

    public Guid VideoId { get; set; }

    public Guid AuthorId { get; set; }

    public Guid? ParentCommentId { get; set; }

    public string Text { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<CommentReaction> Reactions { get; set; } =
        new List<CommentReaction>();
}
