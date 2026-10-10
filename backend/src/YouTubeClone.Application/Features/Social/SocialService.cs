using YouTubeClone.Application.Abstractions.Auth;
using YouTubeClone.Application.Features.Social.Contracts;
using YouTubeClone.Domain.Social;
using YouTubeClone.Domain.Users;

namespace YouTubeClone.Application.Features.Social;

public sealed class SocialService : ISocialService
{
    private readonly ISocialRepository _repository;
    private readonly ICurrentUserContext _currentUser;

    public SocialService(
        ISocialRepository repository,
        ICurrentUserContext currentUser)
    {
        _repository = repository;
        _currentUser = currentUser;
    }

    public async Task<SocialOverviewDto> GetOverviewAsync(
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetRequiredUserId();

        var friendships =
            await _repository.GetFriendshipsAsync(
                currentUserId,
                cancellationToken);

        var otherUserIds =
            friendships
                .Select(item => GetOtherUserId(
                    item,
                    currentUserId))
                .Distinct()
                .ToArray();

        var users =
            await _repository.GetUsersAsync(
                otherUserIds,
                cancellationToken);

        var userMap =
            users.ToDictionary(
                user => user.Id);

        var friends =
            new List<SocialUserDto>();

        var incoming =
            new List<FriendRequestDto>();

        var outgoing =
            new List<FriendRequestDto>();

        foreach (var friendship in friendships)
        {
            var otherUserId =
                GetOtherUserId(
                    friendship,
                    currentUserId);

            if (!userMap.TryGetValue(
                    otherUserId,
                    out var otherUser))
            {
                continue;
            }

            if (friendship.Status ==
                FriendshipStatuses.Accepted)
            {
                friends.Add(
                    MapUser(
                        otherUser,
                        RelationshipStatuses.Friends));

                continue;
            }

            if (friendship.Status !=
                FriendshipStatuses.Pending)
            {
                continue;
            }

            var isOutgoing =
                friendship.RequestedById ==
                currentUserId;

            var request =
                new FriendRequestDto(
                    friendship.Id,
                    MapUser(
                        otherUser,
                        isOutgoing
                            ? RelationshipStatuses.PendingOutgoing
                            : RelationshipStatuses.PendingIncoming),
                    isOutgoing
                        ? "outgoing"
                        : "incoming",
                    friendship.CreatedAt);

            if (isOutgoing)
            {
                outgoing.Add(request);
            }
            else
            {
                incoming.Add(request);
            }
        }

        var unread =
            await _repository.GetUnreadNotificationCountAsync(
                currentUserId,
                cancellationToken);

        return new SocialOverviewDto(
            friends
                .OrderBy(user => user.DisplayName)
                .ToArray(),
            incoming
                .OrderByDescending(item => item.CreatedAt)
                .ToArray(),
            outgoing
                .OrderByDescending(item => item.CreatedAt)
                .ToArray(),
            unread);
    }

    public async Task<IReadOnlyList<SocialUserDto>> SearchUsersAsync(
        string query,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetRequiredUserId();

        var users =
            await _repository.SearchUsersAsync(
                currentUserId,
                query,
                30,
                cancellationToken);

        var friendships =
            await _repository.GetFriendshipsAsync(
                currentUserId,
                cancellationToken);

        var relationshipMap =
            friendships.ToDictionary(
                friendship =>
                    GetOtherUserId(
                        friendship,
                        currentUserId));

        return users
            .Select(user =>
            {
                relationshipMap.TryGetValue(
                    user.Id,
                    out var friendship);

                return MapUser(
                    user,
                    GetRelationshipStatus(
                        friendship,
                        currentUserId));
            })
            .ToArray();
    }

    public async Task<SocialActionResult> SendFriendRequestAsync(
        Guid targetUserId,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetRequiredUserId();

        if (targetUserId == currentUserId)
        {
            return SocialActionResult.Failure(
                SocialActionError.SelfNotAllowed);
        }

        var target =
            await _repository.GetUserAsync(
                targetUserId,
                cancellationToken);

        if (target is null)
        {
            return SocialActionResult.Failure(
                SocialActionError.UserNotFound);
        }

        var existing =
            await _repository.GetFriendshipAsync(
                currentUserId,
                targetUserId,
                cancellationToken);

        if (existing is not null)
        {
            return SocialActionResult.Failure(
                existing.Status ==
                    FriendshipStatuses.Accepted
                    ? SocialActionError.AlreadyFriends
                    : SocialActionError.RequestAlreadyExists);
        }

        var now =
            DateTimeOffset.UtcNow;

        var friendship =
            CreateFriendship(
                currentUserId,
                targetUserId,
                currentUserId,
                now);

        _repository.AddFriendship(
            friendship);

        _repository.AddNotification(
            new SocialNotification
            {
                Id = Guid.NewGuid(),
                UserId = targetUserId,
                Type =
                    SocialNotificationTypes.FriendRequest,
                ActorUserId =
                    currentUserId,
                FriendshipId =
                    friendship.Id,
                TargetPath =
                    "/friends?tab=requests",
                CreatedAt = now
            });

        await _repository.SaveChangesAsync(
            cancellationToken);

        return SocialActionResult.Success(
            MapUser(
                target,
                RelationshipStatuses.PendingOutgoing));
    }

    public async Task<SocialActionResult> AcceptFriendRequestAsync(
        Guid requestId,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetRequiredUserId();

        var friendship =
            await _repository.GetFriendshipByIdAsync(
                requestId,
                cancellationToken);

        if (friendship is null ||
            friendship.Status !=
                FriendshipStatuses.Pending)
        {
            return SocialActionResult.Failure(
                SocialActionError.RequestNotFound);
        }

        var recipientId =
            GetOtherUserId(
                friendship,
                friendship.RequestedById);

        if (recipientId != currentUserId)
        {
            return SocialActionResult.Failure(
                SocialActionError.Forbidden);
        }

        friendship.Status =
            FriendshipStatuses.Accepted;

        friendship.UpdatedAt =
            DateTimeOffset.UtcNow;

        await _repository.MarkFriendshipNotificationsReadAsync(
            currentUserId,
            friendship.Id,
            friendship.UpdatedAt,
            cancellationToken);

        _repository.AddNotification(
            new SocialNotification
            {
                Id = Guid.NewGuid(),
                UserId =
                    friendship.RequestedById,
                Type =
                    SocialNotificationTypes.FriendAccepted,
                ActorUserId =
                    currentUserId,
                FriendshipId =
                    friendship.Id,
                TargetPath =
                    "/friends",
                CreatedAt =
                    friendship.UpdatedAt
            });

        await _repository.SaveChangesAsync(
            cancellationToken);

        var otherUser =
            await _repository.GetUserAsync(
                friendship.RequestedById,
                cancellationToken);

        return otherUser is null
            ? SocialActionResult.Failure(
                SocialActionError.UserNotFound)
            : SocialActionResult.Success(
                MapUser(
                    otherUser,
                    RelationshipStatuses.Friends));
    }

    public Task<SocialActionResult> RejectFriendRequestAsync(
        Guid requestId,
        CancellationToken cancellationToken = default) =>
        RemovePendingRequestAsync(
            requestId,
            requireOutgoing: false,
            cancellationToken);

    public Task<SocialActionResult> CancelFriendRequestAsync(
        Guid requestId,
        CancellationToken cancellationToken = default) =>
        RemovePendingRequestAsync(
            requestId,
            requireOutgoing: true,
            cancellationToken);

    public async Task<SocialActionResult> RemoveFriendAsync(
        Guid friendUserId,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = GetRequiredUserId();

        var friendship =
            await _repository.GetFriendshipAsync(
                currentUserId,
                friendUserId,
                cancellationToken);

        if (friendship is null ||
            friendship.Status !=
                FriendshipStatuses.Accepted)
        {
            return SocialActionResult.Failure(
                SocialActionError.NotFriends);
        }

        var friend =
            await _repository.GetUserAsync(
                friendUserId,
                cancellationToken);

        _repository.RemoveFriendship(
            friendship);

        await _repository.SaveChangesAsync(
            cancellationToken);

        return friend is null
            ? SocialActionResult.Failure(
                SocialActionError.UserNotFound)
            : SocialActionResult.Success(
                MapUser(
                    friend,
                    RelationshipStatuses.None));
    }

    public async Task<IReadOnlyList<SocialNotificationDto>>
        GetNotificationsAsync(
            int take,
            CancellationToken cancellationToken = default)
    {
        var currentUserId = GetRequiredUserId();

        var boundedTake =
            Math.Clamp(
                take,
                1,
                100);

        var notifications =
            await _repository.GetNotificationsAsync(
                currentUserId,
                boundedTake,
                cancellationToken);

        var actorIds =
            notifications
                .Where(item =>
                    item.ActorUserId.HasValue)
                .Select(item =>
                    item.ActorUserId!.Value)
                .Distinct()
                .ToArray();

        var actors =
            await _repository.GetUsersAsync(
                actorIds,
                cancellationToken);

        var actorMap =
            actors.ToDictionary(
                user => user.Id);

        return notifications
            .Select(item =>
            {
                SocialUserDto? actor =
                    null;

                if (item.ActorUserId.HasValue &&
                    actorMap.TryGetValue(
                        item.ActorUserId.Value,
                        out var actorUser))
                {
                    actor =
                        MapUser(
                            actorUser,
                            RelationshipStatuses.None);
                }

                var roomCode =
                    item.Type ==
                        SocialNotificationTypes.WatchPartyInvite &&
                    !string.IsNullOrWhiteSpace(
                        item.TargetPath)
                        ? item.TargetPath
                            .Split(
                                '/',
                                StringSplitOptions.RemoveEmptyEntries)
                            .LastOrDefault()
                        : null;

                return new SocialNotificationDto(
                    item.Id,
                    item.Type,
                    actor,
                    item.TargetPath,
                    roomCode,
                    item.CreatedAt,
                    item.ReadAt);
            })
            .ToArray();
    }

    public Task<int> GetUnreadNotificationCountAsync(
        CancellationToken cancellationToken = default)
    {
        return _repository.GetUnreadNotificationCountAsync(
            GetRequiredUserId(),
            cancellationToken);
    }

    public Task<bool> MarkNotificationReadAsync(
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        return _repository.MarkNotificationReadAsync(
            GetRequiredUserId(),
            notificationId,
            DateTimeOffset.UtcNow,
            cancellationToken);
    }

    public async Task MarkAllNotificationsReadAsync(
        CancellationToken cancellationToken = default)
    {
        await _repository.MarkAllNotificationsReadAsync(
            GetRequiredUserId(),
            DateTimeOffset.UtcNow,
            cancellationToken);

        await _repository.SaveChangesAsync(
            cancellationToken);
    }

    public async Task<WatchPartyInviteResult>
        InviteFriendToWatchPartyAsync(
            WatchPartyInviteCommand command,
            CancellationToken cancellationToken = default)
    {
        var currentUserId = GetRequiredUserId();

        var roomCode =
            command.RoomCode
                .Trim()
                .ToUpperInvariant();

        if (roomCode.Length is < 4 or > 12 ||
            roomCode.Any(character =>
                !char.IsAsciiLetterOrDigit(
                    character)))
        {
            return WatchPartyInviteResult.Failure(
                SocialActionError.InvalidRoomCode);
        }

        var friendship =
            await _repository.GetFriendshipAsync(
                currentUserId,
                command.FriendId,
                cancellationToken);

        if (friendship is null ||
            friendship.Status !=
                FriendshipStatuses.Accepted)
        {
            return WatchPartyInviteResult.Failure(
                SocialActionError.NotFriends);
        }

        var friend =
            await _repository.GetUserAsync(
                command.FriendId,
                cancellationToken);

        if (friend is null)
        {
            return WatchPartyInviteResult.Failure(
                SocialActionError.UserNotFound);
        }

        var now =
            DateTimeOffset.UtcNow;

        var invitation =
            new WatchPartyInvitation
            {
                Id = Guid.NewGuid(),
                SenderId = currentUserId,
                RecipientId =
                    command.FriendId,
                RoomCode = roomCode,
                CreatedAt = now,
                ExpiresAt =
                    now.AddDays(7)
            };

        _repository.AddWatchPartyInvitation(
            invitation);

        _repository.AddNotification(
            new SocialNotification
            {
                Id = Guid.NewGuid(),
                UserId =
                    command.FriendId,
                Type =
                    SocialNotificationTypes.WatchPartyInvite,
                ActorUserId =
                    currentUserId,
                WatchPartyInvitationId =
                    invitation.Id,
                TargetPath =
                    $"/watch-party/{roomCode}",
                CreatedAt = now
            });

        await _repository.SaveChangesAsync(
            cancellationToken);

        return WatchPartyInviteResult.Success(
            new WatchPartyInviteDto(
                invitation.Id,
                command.FriendId,
                roomCode,
                invitation.CreatedAt,
                invitation.ExpiresAt));
    }

    private async Task<SocialActionResult> RemovePendingRequestAsync(
        Guid requestId,
        bool requireOutgoing,
        CancellationToken cancellationToken)
    {
        var currentUserId = GetRequiredUserId();

        var friendship =
            await _repository.GetFriendshipByIdAsync(
                requestId,
                cancellationToken);

        if (friendship is null ||
            friendship.Status !=
                FriendshipStatuses.Pending)
        {
            return SocialActionResult.Failure(
                SocialActionError.RequestNotFound);
        }

        var isOutgoing =
            friendship.RequestedById ==
            currentUserId;

        if (isOutgoing != requireOutgoing)
        {
            return SocialActionResult.Failure(
                SocialActionError.Forbidden);
        }

        var otherUserId =
            GetOtherUserId(
                friendship,
                currentUserId);

        var otherUser =
            await _repository.GetUserAsync(
                otherUserId,
                cancellationToken);

        await _repository.MarkFriendshipNotificationsReadAsync(
            requireOutgoing
                ? otherUserId
                : currentUserId,
            friendship.Id,
            DateTimeOffset.UtcNow,
            cancellationToken);

        _repository.RemoveFriendship(
            friendship);

        await _repository.SaveChangesAsync(
            cancellationToken);

        return otherUser is null
            ? SocialActionResult.Failure(
                SocialActionError.UserNotFound)
            : SocialActionResult.Success(
                MapUser(
                    otherUser,
                    RelationshipStatuses.None));
    }

    private Guid GetRequiredUserId()
    {
        return _currentUser.UserId
            ?? throw new InvalidOperationException(
                "Social features require an authenticated user.");
    }

    private static Friendship CreateFriendship(
        Guid firstUserId,
        Guid secondUserId,
        Guid requestedById,
        DateTimeOffset createdAt)
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

        return new Friendship
        {
            Id = Guid.NewGuid(),
            UserAId = userAId,
            UserBId = userBId,
            RequestedById =
                requestedById,
            Status =
                FriendshipStatuses.Pending,
            CreatedAt =
                createdAt,
            UpdatedAt =
                createdAt
        };
    }

    private static Guid GetOtherUserId(
        Friendship friendship,
        Guid currentUserId)
    {
        return friendship.UserAId ==
            currentUserId
            ? friendship.UserBId
            : friendship.UserAId;
    }

    private static string GetRelationshipStatus(
        Friendship? friendship,
        Guid currentUserId)
    {
        if (friendship is null)
        {
            return RelationshipStatuses.None;
        }

        if (friendship.Status ==
            FriendshipStatuses.Accepted)
        {
            return RelationshipStatuses.Friends;
        }

        return friendship.RequestedById ==
            currentUserId
            ? RelationshipStatuses.PendingOutgoing
            : RelationshipStatuses.PendingIncoming;
    }

    private static SocialUserDto MapUser(
        User user,
        string relationshipStatus)
    {
        return new SocialUserDto(
            user.Id,
            user.DisplayName,
            $"@{user.UserName}",
            string.IsNullOrWhiteSpace(
                user.AvatarPath)
                ? null
                : $"/api/v1/users/{user.Id}/avatar",
            relationshipStatus);
    }
}
