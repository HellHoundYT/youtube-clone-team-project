export type RelationshipStatus =
  | 'none'
  | 'pendingOutgoing'
  | 'pendingIncoming'
  | 'friends'

export interface SocialUser {
  id: string
  displayName: string
  handle: string
  avatarUrl: string | null
  relationshipStatus: RelationshipStatus
}

export interface FriendRequest {
  id: string
  user: SocialUser
  direction: 'incoming' | 'outgoing'
  createdAt: string
}

export interface SocialOverview {
  friends: SocialUser[]
  incomingRequests: FriendRequest[]
  outgoingRequests: FriendRequest[]
  unreadNotificationCount: number
}

export interface SocialNotification {
  id: string
  type:
    | 'FriendRequest'
    | 'FriendAccepted'
    | 'WatchPartyInvite'
    | string
  actor: SocialUser | null
  targetPath: string | null
  roomCode: string | null
  createdAt: string
  readAt: string | null
}

export interface WatchPartyInvite {
  id: string
  friendId: string
  roomCode: string
  createdAt: string
  expiresAt: string
}
