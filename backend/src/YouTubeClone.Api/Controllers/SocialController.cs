using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YouTubeClone.Application.Features.Social;
using YouTubeClone.Application.Features.Social.Contracts;

namespace YouTubeClone.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/social")]
public sealed class SocialController : ControllerBase
{
    private readonly ISocialService _socialService;

    public SocialController(
        ISocialService socialService)
    {
        _socialService = socialService;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<SocialOverviewDto>>
        GetOverview(
            CancellationToken cancellationToken)
    {
        return Ok(
            await _socialService.GetOverviewAsync(
                cancellationToken));
    }

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<SocialUserDto>>>
        SearchUsers(
            [FromQuery] string query = "",
            CancellationToken cancellationToken = default)
    {
        return Ok(
            await _socialService.SearchUsersAsync(
                query,
                cancellationToken));
    }

    [HttpPost("requests/{userId:guid}")]
    public async Task<ActionResult<SocialUserDto>>
        SendFriendRequest(
            Guid userId,
            CancellationToken cancellationToken)
    {
        return ToActionResult(
            await _socialService.SendFriendRequestAsync(
                userId,
                cancellationToken));
    }

    [HttpPost("requests/{requestId:guid}/accept")]
    public async Task<ActionResult<SocialUserDto>>
        AcceptFriendRequest(
            Guid requestId,
            CancellationToken cancellationToken)
    {
        return ToActionResult(
            await _socialService.AcceptFriendRequestAsync(
                requestId,
                cancellationToken));
    }

    [HttpPost("requests/{requestId:guid}/reject")]
    public async Task<ActionResult<SocialUserDto>>
        RejectFriendRequest(
            Guid requestId,
            CancellationToken cancellationToken)
    {
        return ToActionResult(
            await _socialService.RejectFriendRequestAsync(
                requestId,
                cancellationToken));
    }

    [HttpDelete("requests/{requestId:guid}")]
    public async Task<ActionResult<SocialUserDto>>
        CancelFriendRequest(
            Guid requestId,
            CancellationToken cancellationToken)
    {
        return ToActionResult(
            await _socialService.CancelFriendRequestAsync(
                requestId,
                cancellationToken));
    }

    [HttpDelete("friends/{friendUserId:guid}")]
    public async Task<ActionResult<SocialUserDto>>
        RemoveFriend(
            Guid friendUserId,
            CancellationToken cancellationToken)
    {
        return ToActionResult(
            await _socialService.RemoveFriendAsync(
                friendUserId,
                cancellationToken));
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<IReadOnlyList<SocialNotificationDto>>>
        GetNotifications(
            [FromQuery] int take = 50,
            CancellationToken cancellationToken = default)
    {
        return Ok(
            await _socialService.GetNotificationsAsync(
                take,
                cancellationToken));
    }

    [HttpGet("notifications/unread-count")]
    public async Task<ActionResult<object>>
        GetUnreadNotificationCount(
            CancellationToken cancellationToken)
    {
        var count =
            await _socialService.GetUnreadNotificationCountAsync(
                cancellationToken);

        return Ok(new { count });
    }

    [HttpPost("notifications/{notificationId:guid}/read")]
    public async Task<IActionResult>
        MarkNotificationRead(
            Guid notificationId,
            CancellationToken cancellationToken)
    {
        var updated =
            await _socialService.MarkNotificationReadAsync(
                notificationId,
                cancellationToken);

        return updated
            ? NoContent()
            : NotFound();
    }

    [HttpPost("notifications/read-all")]
    public async Task<IActionResult>
        MarkAllNotificationsRead(
            CancellationToken cancellationToken)
    {
        await _socialService.MarkAllNotificationsReadAsync(
            cancellationToken);

        return NoContent();
    }

    [HttpPost("watch-party-invites")]
    public async Task<ActionResult<WatchPartyInviteDto>>
        InviteToWatchParty(
            WatchPartyInviteCommand command,
            CancellationToken cancellationToken)
    {
        var result =
            await _socialService.InviteFriendToWatchPartyAsync(
                command,
                cancellationToken);

        if (result.Invitation is not null)
        {
            return Ok(
                result.Invitation);
        }

        return result.Error switch
        {
            SocialActionError.UserNotFound =>
                NotFound(
                    new
                    {
                        message =
                            "User was not found."
                    }),
            SocialActionError.NotFriends =>
                Conflict(
                    new
                    {
                        message =
                            "Watch Party invitations can only be sent to friends."
                    }),
            SocialActionError.InvalidRoomCode =>
                BadRequest(
                    new
                    {
                        message =
                            "Room code is invalid."
                    }),
            _ =>
                BadRequest(
                    new
                    {
                        message =
                            "Invitation could not be sent."
                    })
        };
    }

    private ActionResult<SocialUserDto> ToActionResult(
        SocialActionResult result)
    {
        if (result.User is not null)
        {
            return Ok(
                result.User);
        }

        return result.Error switch
        {
            SocialActionError.UserNotFound =>
                NotFound(
                    new
                    {
                        message =
                            "User was not found."
                    }),
            SocialActionError.RequestNotFound =>
                NotFound(
                    new
                    {
                        message =
                            "Friend request was not found."
                    }),
            SocialActionError.Forbidden =>
                StatusCode(
                    StatusCodes.Status403Forbidden,
                    new
                    {
                        message =
                            "This friend request does not belong to the current user."
                    }),
            SocialActionError.AlreadyFriends =>
                Conflict(
                    new
                    {
                        message =
                            "These users are already friends."
                    }),
            SocialActionError.RequestAlreadyExists =>
                Conflict(
                    new
                    {
                        message =
                            "A friend request already exists between these users."
                    }),
            SocialActionError.NotFriends =>
                Conflict(
                    new
                    {
                        message =
                            "These users are not friends."
                    }),
            SocialActionError.SelfNotAllowed =>
                BadRequest(
                    new
                    {
                        message =
                            "You cannot send a friend request to yourself."
                    }),
            _ =>
                BadRequest(
                    new
                    {
                        message =
                            "Social action could not be completed."
                    })
        };
    }
}
