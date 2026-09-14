export interface Channel {
  id: string
  name: string
  handle: string
  description: string
  avatarUrl: string | null
  bannerUrl: string | null
  subscriberCount: number
  isSubscribed: boolean
  isOwner: boolean
}

export interface SaveChannelRequest {
  name: string
  handle: string
  description: string
}
