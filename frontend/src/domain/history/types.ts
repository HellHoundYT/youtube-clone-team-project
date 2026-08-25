import type {
  VideoListItem,
} from '../video/types'

export interface WatchHistoryItem {
  videoId: string
  progressSeconds: number
  completed: boolean
  lastWatchedAt: string
  video: VideoListItem
}

export interface HistoryStatus {
  isPaused: boolean
}
