namespace YouTubeClone.Domain.Channels;

public sealed class Channel
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Handle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AvatarPath { get; set; }
    public string? BannerPath { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
