export interface LiveStreamListItem {
  id: string
  channelId: string
  channelName: string
  channelAvatarPath: string | null
  title: string
  category: string
  categorySlug: string
  thumbnailPath: string | null
  viewerCount: number
  isLive: boolean
  startedAt: string
}

export interface LiveStreamDetails
  extends LiveStreamListItem {
  description: string
  playbackUrl: string
  tags: string[]
}

export interface StreamCategory {
  name: string
  slug: string
  liveStreamCount: number
  viewerCount: number
}
