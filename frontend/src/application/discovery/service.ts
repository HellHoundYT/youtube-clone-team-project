import type {
  CancellationSignal,
} from '../common/cancellation'
import type {
  Category,
} from '../../domain/category/types'
import type {
  VideoListItem,
} from '../../domain/video/types'
import type {
  DiscoveryGateway,
} from './gateway'
import type {
  GetCategoryVideosParams,
  SearchResponse,
} from './types'

export interface DiscoveryService {
  searchVideos(
    query: string,
    signal?: CancellationSignal,
  ): Promise<SearchResponse>

  getCategories(
    signal?: CancellationSignal,
  ): Promise<Category[]>

  getCategoryVideos(
    slug: string,
    params?: GetCategoryVideosParams,
    signal?: CancellationSignal,
  ): Promise<VideoListItem[]>
}

export function createDiscoveryService(
  gateway: DiscoveryGateway,
): DiscoveryService {
  return {
    searchVideos: (
      query,
      signal,
    ) =>
      gateway.searchVideos(
        query,
        signal,
      ),

    getCategories: (
      signal,
    ) =>
      gateway.getCategories(
        signal,
      ),

    getCategoryVideos: (
      slug,
      params,
      signal,
    ) =>
      gateway.getCategoryVideos(
        slug,
        params,
        signal,
      ),
  }
}
