import axios from 'axios'
import type {
  GetCategoryVideosParams,
  SearchResponse,
} from '../../application/discovery/types'
import type {
  Category,
} from '../../domain/category/types'
import type {
  VideoListItem,
} from '../../domain/video/types'

export type {
  GetCategoryVideosParams,
  SearchResponse,
} from '../../application/discovery/types'
export type {
  Category,
} from '../../domain/category/types'

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
