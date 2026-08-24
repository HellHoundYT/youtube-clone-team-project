import type {
  VideoListItem,
} from '../video/types'

export interface FavoriteItem {
  videoId: string
  createdAt: string
  video: VideoListItem
}
