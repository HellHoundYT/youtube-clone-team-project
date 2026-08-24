export interface VideoListItem {
  id: string
  channelId: string
  channelName: string
  channelAvatarPath: string | null
  category: string | null
  categorySlug: string | null
  title: string
  thumbnailPath: string | null
  durationSeconds: number
  viewCount: number
  publishedAt: string | null
}

export interface VideoDetails
  extends VideoListItem {
  description: string | null
  videoPath: string
  visibility: string
}

export type VideoReactionType =
  | 'Like'
  | 'Dislike'
