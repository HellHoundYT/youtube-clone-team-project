import axios from 'axios'
import type {
  VideoListItem,
} from './videos'

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

export interface UpdateHistoryRequest {
  progressSeconds: number
  completed: boolean
}

export interface FavoriteItem {
  videoId: string
  createdAt: string
  video: VideoListItem
}

export async function getWatchHistory(
  signal?: AbortSignal,
): Promise<WatchHistoryItem[]> {
  const response =
    await axios.get<WatchHistoryItem[]>(
      '/api/v1/history',
      {
        signal,
      },
    )

  return response.data
}

export async function updateWatchHistory(
  videoId: string,
  request: UpdateHistoryRequest,
): Promise<WatchHistoryItem | null> {
  const response =
    await axios.put<WatchHistoryItem>(
      `/api/v1/history/${videoId}`,
      request,
      {
        validateStatus: (status) =>
          status === 200 ||
          status === 204,
      },
    )

  if (response.status === 204) {
    return null
  }

  return response.data
}

export async function removeHistoryItem(
  videoId: string,
): Promise<void> {
  await axios.delete(
    `/api/v1/history/${videoId}`,
  )
}

export async function clearWatchHistory():
Promise<void> {
  await axios.delete(
    '/api/v1/history',
  )
}

export async function getHistoryStatus(
  signal?: AbortSignal,
): Promise<HistoryStatus> {
  const response =
    await axios.get<HistoryStatus>(
      '/api/v1/history/status',
      {
        signal,
      },
    )

  return response.data
}

export async function setHistoryPaused(
  isPaused: boolean,
): Promise<HistoryStatus> {
  const response =
    await axios.put<HistoryStatus>(
      '/api/v1/history/status',
      {
        isPaused,
      },
    )

  return response.data
}

export async function getFavorites(
  signal?: AbortSignal,
): Promise<FavoriteItem[]> {
  const response =
    await axios.get<FavoriteItem[]>(
      '/api/v1/favorites',
      {
        signal,
      },
    )

  return response.data
}

export async function addFavorite(
  videoId: string,
): Promise<FavoriteItem> {
  const response =
    await axios.post<FavoriteItem>(
      `/api/v1/favorites/${videoId}`,
    )

  return response.data
}

export async function removeFavorite(
  videoId: string,
): Promise<void> {
  await axios.delete(
    `/api/v1/favorites/${videoId}`,
  )
}