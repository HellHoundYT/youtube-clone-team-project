using YouTubeClone.Domain.Social;
using YouTubeClone.Domain.Users;

namespace YouTubeClone.Application.Features.Social;

public interface ISocialRepository
{
    Task<User?> GetUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<User>> SearchUsersAsync(
        Guid currentUserId,
        string query,
        int take,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<User>> GetUsersAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken = default);

    Task<Friendship?> GetFriendshipAsync(
        Guid firstUserId,
        Guid secondUserId,
        CancellationToken cancellationToken = default);

    Task<Friendship?> GetFriendshipByIdAsync(
        Guid friendshipId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Friendship>> GetFriendshipsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    void AddFriendship(Friendship friendship);

    void RemoveFriendship(Friendship friendship);

    void AddNotification(
        SocialNotification notification);

    Task<IReadOnlyList<SocialNotification>> GetNotificationsAsync(
        Guid userId,
        int take,
        CancellationToken cancellationToken = default);

    Task<int> GetUnreadNotificationCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<bool> MarkNotificationReadAsync(
        Guid userId,
        Guid notificationId,
        DateTimeOffset readAt,
        CancellationToken cancellationToken = default);

    Task MarkAllNotificationsReadAsync(
        Guid userId,
        DateTimeOffset readAt,
        CancellationToken cancellationToken = default);

    Task MarkFriendshipNotificationsReadAsync(
        Guid userId,
        Guid friendshipId,
        DateTimeOffset readAt,
        CancellationToken cancellationToken = default);

    void AddWatchPartyInvitation(
        WatchPartyInvitation invitation);

    Task SaveChangesAsync(
        CancellationToken cancellationToken = default);
}
