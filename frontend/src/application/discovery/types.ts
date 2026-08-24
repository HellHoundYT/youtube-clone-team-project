import type {
  VideoListItem,
} from '../../domain/video/types'

export interface SearchResponse {
  query: string
  videos: VideoListItem[]
}

export interface GetCategoryVideosParams {
  page?: number
  pageSize?: number
}
