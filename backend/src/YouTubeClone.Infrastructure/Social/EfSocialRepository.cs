using Microsoft.EntityFrameworkCore;
using YouTubeClone.Application.Features.Social;
using YouTubeClone.Domain.Social;
using YouTubeClone.Domain.Users;
using YouTubeClone.Infrastructure.Persistence;

namespace YouTubeClone.Infrastructure.Social;

public sealed class EfSocialRepository : ISocialRepository
{
    private readonly AppDbContext _dbContext;

    public EfSocialRepository(
        AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<User?> GetUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(
                user => user.Id == userId,
                cancellationToken);
    }

    public async Task<IReadOnlyList<User>> SearchUsersAsync(
        Guid currentUserId,
        string query,
        int take,
        CancellationToken cancellationToken = default)
    {
        var normalized =
            query.Trim().TrimStart('@').ToLower();

        var users =
            _dbContext.Users
                .AsNoTracking()
                .Where(user =>
                    user.Id != currentUserId);

        if (!string.IsNullOrWhiteSpace(
                normalized))
        {
            users =
                users.Where(user =>
                    user.UserName
                        .ToLower()
                        .Contains(normalized) ||
                    user.DisplayName
                        .ToLower()
                        .Contains(normalized));
        }

        return await users
            .OrderBy(user =>
                user.DisplayName)
            .ThenBy(user =>
                user.UserName)
            .Take(take)
            .ToListAsync(
                cancellationToken);
    }

    public async Task<IReadOnlyList<User>> GetUsersAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        if (userIds.Count == 0)
        {
            return Array.Empty<User>();
        }

        return await _dbContext.Users
            .AsNoTracking()
            .Where(user =>
                userIds.Contains(
                    user.Id))
            .ToListAsync(
                cancellationToken);
    }

    public Task<Friendship?> GetFriendshipAsync(
        Guid firstUserId,
        Guid secondUserId,
        CancellationToken cancellationToken = default)
    {
        var userAId =
            firstUserId.CompareTo(
                secondUserId) < 0
                ? firstUserId
                : secondUserId;

        var userBId =
            userAId == firstUserId
                ? secondUserId
                : firstUserId;

        return _dbContext.Friendships
            .SingleOrDefaultAsync(
                friendship =>
                    friendship.UserAId ==
                        userAId &&
                    friendship.UserBId ==
                        userBId,
                cancellationToken);
    }

    public Task<Friendship?> GetFriendshipByIdAsync(
        Guid friendshipId,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.Friendships
            .SingleOrDefaultAsync(
                friendship =>
                    friendship.Id ==
                    friendshipId,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Friendship>> GetFriendshipsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Friendships
            .AsNoTracking()
            .Where(friendship =>
                friendship.UserAId ==
                    userId ||
                friendship.UserBId ==
                    userId)
            .ToListAsync(
                cancellationToken);
    }

    public void AddFriendship(
        Friendship friendship)
    {
        _dbContext.Friendships.Add(
            friendship);
    }

    public void RemoveFriendship(
        Friendship friendship)
    {
        _dbContext.Friendships.Remove(
            friendship);
    }

    public void AddNotification(
        SocialNotification notification)
    {
        _dbContext.SocialNotifications.Add(
            notification);
    }

    public async Task<IReadOnlyList<SocialNotification>>
        GetNotificationsAsync(
            Guid userId,
            int take,
            CancellationToken cancellationToken = default)
    {
        return await _dbContext.SocialNotifications
            .AsNoTracking()
            .Where(notification =>
                notification.UserId ==
                userId)
            .OrderByDescending(
                notification =>
                    notification.CreatedAt)
            .Take(take)
            .ToListAsync(
                cancellationToken);
    }

    public Task<int> GetUnreadNotificationCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return _dbContext.SocialNotifications
            .CountAsync(
                notification =>
                    notification.UserId ==
                        userId &&
                    notification.ReadAt ==
                        null,
                cancellationToken);
    }

    public async Task<bool> MarkNotificationReadAsync(
        Guid userId,
        Guid notificationId,
        DateTimeOffset readAt,
        CancellationToken cancellationToken = default)
    {
        var notification =
            await _dbContext.SocialNotifications
                .SingleOrDefaultAsync(
                    item =>
                        item.Id ==
                            notificationId &&
                        item.UserId ==
                            userId,
                    cancellationToken);

        if (notification is null)
        {
            return false;
        }

        notification.ReadAt ??=
            readAt;

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task MarkAllNotificationsReadAsync(
        Guid userId,
        DateTimeOffset readAt,
        CancellationToken cancellationToken = default)
    {
        var notifications =
            await _dbContext.SocialNotifications
                .Where(notification =>
                    notification.UserId ==
                        userId &&
                    notification.ReadAt ==
                        null)
                .ToListAsync(
                    cancellationToken);

        foreach (var notification in notifications)
        {
            notification.ReadAt =
                readAt;
        }
    }

    public async Task MarkFriendshipNotificationsReadAsync(
        Guid userId,
        Guid friendshipId,
        DateTimeOffset readAt,
        CancellationToken cancellationToken = default)
    {
        var notifications =
            await _dbContext.SocialNotifications
                .Where(notification =>
                    notification.UserId ==
                        userId &&
                    notification.FriendshipId ==
                        friendshipId &&
                    notification.ReadAt ==
                        null)
                .ToListAsync(
                    cancellationToken);

        foreach (var notification in notifications)
        {
            notification.ReadAt =
                readAt;
        }
    }

    public void AddWatchPartyInvitation(
        WatchPartyInvitation invitation)
    {
        _dbContext.WatchPartyInvitations.Add(
            invitation);
    }

    public Task SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(
            cancellationToken);
    }
}
