import type {
  SocialNotification,
  SocialOverview,
  SocialUser,
  WatchPartyInvite,
} from '../../domain/social/types'
import type {
  SocialGateway,
} from './gateway'

export interface SocialService {
  getOverview():
    Promise<SocialOverview>

  searchUsers(
    query: string,
  ): Promise<SocialUser[]>

  sendFriendRequest(
    userId: string,
  ): Promise<SocialUser>

  acceptFriendRequest(
    requestId: string,
  ): Promise<SocialUser>

  rejectFriendRequest(
    requestId: string,
  ): Promise<SocialUser>

  cancelFriendRequest(
    requestId: string,
  ): Promise<SocialUser>

  removeFriend(
    userId: string,
  ): Promise<SocialUser>

  getNotifications(
    take?: number,
  ): Promise<SocialNotification[]>

  getUnreadCount():
    Promise<number>

  markNotificationRead(
    notificationId: string,
  ): Promise<void>

  markAllNotificationsRead():
    Promise<void>

  inviteToWatchParty(
    friendId: string,
    roomCode: string,
  ): Promise<WatchPartyInvite>
}

export function createSocialService(
  gateway: SocialGateway,
): SocialService {
  return {
    getOverview:
      gateway.getOverview,

    searchUsers:
      gateway.searchUsers,

    sendFriendRequest:
      gateway.sendFriendRequest,

    acceptFriendRequest:
      gateway.acceptFriendRequest,

    rejectFriendRequest:
      gateway.rejectFriendRequest,

    cancelFriendRequest:
      gateway.cancelFriendRequest,

    removeFriend:
      gateway.removeFriend,

    getNotifications:
      gateway.getNotifications,

    getUnreadCount:
      gateway.getUnreadCount,

    markNotificationRead:
      gateway.markNotificationRead,

    markAllNotificationsRead:
      gateway.markAllNotificationsRead,

    inviteToWatchParty:
      gateway.inviteToWatchParty,
  }
}
