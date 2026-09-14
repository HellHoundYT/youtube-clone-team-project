namespace YouTubeClone.Application.Features.Channels;

public sealed record ChannelModel(
    Guid Id,
    Guid OwnerId,
    string Name,
    string Handle,
    string Description,
    string? AvatarPath,
    string? BannerPath,
    int SubscriberCount,
    bool IsSubscribed);

public sealed record SaveChannelCommand(
    string Name,
    string Handle,
    string Description);

public enum ChannelImageKind
{
    Avatar,
    Banner
}

public enum ChannelError
{
    None,
    NotFound,
    OwnerNotFound,
    AlreadyOwnsChannel,
    HandleRequired,
    NameRequired,
    HandleTaken,
    Forbidden,
    CannotSubscribeOwnChannel
}

public sealed record ChannelResult(
    ChannelModel? Channel,
    ChannelError Error)
{
    public static ChannelResult Success(ChannelModel channel) =>
        new(channel, ChannelError.None);

    public static ChannelResult Failure(ChannelError error) =>
        new(null, error);
}
