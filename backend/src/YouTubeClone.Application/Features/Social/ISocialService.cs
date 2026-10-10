using YouTubeClone.Application.Features.Social.Contracts;

namespace YouTubeClone.Application.Features.Social;

public interface ISocialService
{
    Task<SocialOverviewDto> GetOverviewAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SocialUserDto>> SearchUsersAsync(
        string query,
        CancellationToken cancellationToken = default);

    Task<SocialActionResult> SendFriendRequestAsync(
        Guid targetUserId,
        CancellationToken cancellationToken = default);

    Task<SocialActionResult> AcceptFriendRequestAsync(
        Guid requestId,
        CancellationToken cancellationToken = default);

    Task<SocialActionResult> RejectFriendRequestAsync(
        Guid requestId,
        CancellationToken cancellationToken = default);

    Task<SocialActionResult> CancelFriendRequestAsync(
        Guid requestId,
        CancellationToken cancellationToken = default);

    Task<SocialActionResult> RemoveFriendAsync(
        Guid friendUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SocialNotificationDto>> GetNotificationsAsync(
        int take,
        CancellationToken cancellationToken = default);

    Task<int> GetUnreadNotificationCountAsync(
        CancellationToken cancellationToken = default);

    Task<bool> MarkNotificationReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken = default);

    Task MarkAllNotificationsReadAsync(
        CancellationToken cancellationToken = default);

    Task<WatchPartyInviteResult> InviteFriendToWatchPartyAsync(
        WatchPartyInviteCommand command,
        CancellationToken cancellationToken = default);
}
