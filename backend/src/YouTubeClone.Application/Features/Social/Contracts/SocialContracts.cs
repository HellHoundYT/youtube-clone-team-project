namespace YouTubeClone.Application.Features.Social.Contracts;

public static class RelationshipStatuses
{
    public const string None = "none";
    public const string PendingOutgoing = "pendingOutgoing";
    public const string PendingIncoming = "pendingIncoming";
    public const string Friends = "friends";
}

public sealed record SocialUserDto(
    Guid Id,
    string DisplayName,
    string Handle,
    string? AvatarUrl,
    string RelationshipStatus);

public sealed record FriendRequestDto(
    Guid Id,
    SocialUserDto User,
    string Direction,
    DateTimeOffset CreatedAt);

public sealed record SocialNotificationDto(
    Guid Id,
    string Type,
    SocialUserDto? Actor,
    string? TargetPath,
    string? RoomCode,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReadAt);

public sealed record SocialOverviewDto(
    IReadOnlyList<SocialUserDto> Friends,
    IReadOnlyList<FriendRequestDto> IncomingRequests,
    IReadOnlyList<FriendRequestDto> OutgoingRequests,
    int UnreadNotificationCount);

public sealed record WatchPartyInviteCommand(
    Guid FriendId,
    string RoomCode);

public sealed record WatchPartyInviteDto(
    Guid Id,
    Guid FriendId,
    string RoomCode,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt);

public enum SocialActionError
{
    None,
    UserNotFound,
    SelfNotAllowed,
    AlreadyFriends,
    RequestAlreadyExists,
    RequestNotFound,
    Forbidden,
    NotFriends,
    InvalidRoomCode
}

public sealed record SocialActionResult(
    SocialUserDto? User,
    SocialActionError Error)
{
    public static SocialActionResult Success(
        SocialUserDto user) =>
        new(user, SocialActionError.None);

    public static SocialActionResult Failure(
        SocialActionError error) =>
        new(null, error);
}

public sealed record WatchPartyInviteResult(
    WatchPartyInviteDto? Invitation,
    SocialActionError Error)
{
    public static WatchPartyInviteResult Success(
        WatchPartyInviteDto invitation) =>
        new(invitation, SocialActionError.None);

    public static WatchPartyInviteResult Failure(
        SocialActionError error) =>
        new(null, error);
}
