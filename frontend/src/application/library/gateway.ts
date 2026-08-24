import type {
  CancellationSignal,
} from '../common/cancellation'
import type {
  FavoriteItem,
} from '../../domain/favorite/types'
import type {
  HistoryStatus,
  WatchHistoryItem,
} from '../../domain/history/types'
import type {
  UpdateHistoryRequest,
} from './types'

export interface LibraryGateway {
  getWatchHistory(
    signal?: CancellationSignal,
  ): Promise<WatchHistoryItem[]>

  updateWatchHistory(
    videoId: string,
    request: UpdateHistoryRequest,
  ): Promise<WatchHistoryItem | null>

  removeHistoryItem(
    videoId: string,
  ): Promise<void>

  clearWatchHistory(): Promise<void>

  getHistoryStatus(
    signal?: CancellationSignal,
  ): Promise<HistoryStatus>

  setHistoryPaused(
    isPaused: boolean,
  ): Promise<HistoryStatus>

  getFavorites(
    signal?: CancellationSignal,
  ): Promise<FavoriteItem[]>

  addFavorite(
    videoId: string,
  ): Promise<FavoriteItem>

  removeFavorite(
    videoId: string,
  ): Promise<void>
}
