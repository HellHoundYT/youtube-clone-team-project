import type {
  SocialNotification,
  SocialOverview,
  SocialUser,
  WatchPartyInvite,
} from '../../domain/social/types'

export interface SocialGateway {
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
