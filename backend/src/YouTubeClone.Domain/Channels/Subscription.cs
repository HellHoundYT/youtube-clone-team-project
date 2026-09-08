namespace YouTubeClone.Domain.Channels;

public sealed class Subscription
{
    public Guid SubscriberId { get; set; }
    public Guid ChannelId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public Channel Channel { get; set; } = null!;
}
