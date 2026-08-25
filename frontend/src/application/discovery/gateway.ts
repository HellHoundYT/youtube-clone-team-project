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
  GetCategoryVideosParams,
  SearchResponse,
} from './types'

export interface DiscoveryGateway {
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
