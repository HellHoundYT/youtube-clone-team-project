import axios from 'axios'
import type {
  VideoListItem,
} from './videos'

export interface Category {
  name: string
  slug: string
}

export interface SearchResponse {
  query: string
  videos: VideoListItem[]
}

export interface GetCategoryVideosParams {
  page?: number
  pageSize?: number
}

export async function searchVideos(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const response =
    await axios.get<SearchResponse>(
      '/api/v1/search',
      {
        params: {
          query,
        },
        signal,
      },
    )

  return response.data
}

export async function getCategories(
  signal?: AbortSignal,
): Promise<Category[]> {
  const response =
    await axios.get<Category[]>(
      '/api/v1/categories',
      {
        signal,
      },
    )

  return response.data
}

export async function getCategoryVideos(
  slug: string,
  params: GetCategoryVideosParams = {},
  signal?: AbortSignal,
): Promise<VideoListItem[]> {
  const response =
    await axios.get<VideoListItem[]>(
      `/api/v1/categories/${encodeURIComponent(slug)}/videos`,
      {
        params,
        signal,
      },
    )

  return response.data
}