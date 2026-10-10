import axios from 'axios'
import type {
  SocialGateway,
} from '../../application/social/gateway'
import type {
  SocialNotification,
  SocialOverview,
  SocialUser,
  WatchPartyInvite,
} from '../../domain/social/types'
import {
  createAuthorizedConfig,
  withAuthenticatedRequest,
} from './authSession'

function authorizedGet<T>(
  url: string,
) {
  return withAuthenticatedRequest(
    (token) =>
      axios.get<T>(
        url,
        {
          withCredentials:
            true,

          ...createAuthorizedConfig(
            token,
          ),
        },
      ),
  )
}

function authorizedPost<T>(
  url: string,
  data?: unknown,
) {
  return withAuthenticatedRequest(
    (token) =>
      axios.post<T>(
        url,
        data,
        {
          withCredentials:
            true,

          ...createAuthorizedConfig(
            token,
          ),
        },
      ),
  )
}

function authorizedDelete<T>(
  url: string,
) {
  return withAuthenticatedRequest(
    (token) =>
      axios.delete<T>(
        url,
        {
          withCredentials:
            true,

          ...createAuthorizedConfig(
            token,
          ),
        },
      ),
  )
}

export const socialGateway:
SocialGateway = {
  async getOverview() {
    const response =
      await authorizedGet<
        SocialOverview
      >(
        '/api/v1/social/overview',
      )

    return response.data
  },

  async searchUsers(
    query,
  ) {
    const response =
      await authorizedGet<
        SocialUser[]
      >(
        `/api/v1/social/users?query=${encodeURIComponent(
          query,
        )}`,
      )

    return response.data
  },

  async sendFriendRequest(
    userId,
  ) {
    const response =
      await authorizedPost<
        SocialUser
      >(
        `/api/v1/social/requests/${userId}`,
      )

    return response.data
  },

  async acceptFriendRequest(
    requestId,
  ) {
    const response =
      await authorizedPost<
        SocialUser
      >(
        `/api/v1/social/requests/${requestId}/accept`,
      )

    return response.data
  },

  async rejectFriendRequest(
    requestId,
  ) {
    const response =
      await authorizedPost<
        SocialUser
      >(
        `/api/v1/social/requests/${requestId}/reject`,
      )

    return response.data
  },

  async cancelFriendRequest(
    requestId,
  ) {
    const response =
      await authorizedDelete<
        SocialUser
      >(
        `/api/v1/social/requests/${requestId}`,
      )

    return response.data
  },

  async removeFriend(
    userId,
  ) {
    const response =
      await authorizedDelete<
        SocialUser
      >(
        `/api/v1/social/friends/${userId}`,
      )

    return response.data
  },

  async getNotifications(
    take = 50,
  ) {
    const response =
      await authorizedGet<
        SocialNotification[]
      >(
        `/api/v1/social/notifications?take=${take}`,
      )

    return response.data
  },

  async getUnreadCount() {
    const response =
      await authorizedGet<{
        count: number
      }>(
        '/api/v1/social/notifications/unread-count',
      )

    return response.data.count
  },

  async markNotificationRead(
    notificationId,
  ) {
    await authorizedPost(
      `/api/v1/social/notifications/${notificationId}/read`,
    )
  },

  async markAllNotificationsRead() {
    await authorizedPost(
      '/api/v1/social/notifications/read-all',
    )
  },

  async inviteToWatchParty(
    friendId,
    roomCode,
  ) {
    const response =
      await authorizedPost<
        WatchPartyInvite
      >(
        '/api/v1/social/watch-party-invites',
        {
          friendId,
          roomCode,
        },
      )

    return response.data
  },
}
