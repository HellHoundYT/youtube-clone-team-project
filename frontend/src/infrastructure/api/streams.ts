import axios from 'axios'
import type {
  LiveStreamDetails,
  LiveStreamListItem,
  StreamCategory,
} from '../../domain/stream/types'

export type {
  LiveStreamDetails,
  LiveStreamListItem,
  StreamCategory,
} from '../../domain/stream/types'

export async function getLiveStreams(
  category?: string,
  signal?: AbortSignal,
): Promise<LiveStreamListItem[]> {
  const response =
    await axios.get<LiveStreamListItem[]>(
      '/api/v1/streams',
      {
        params:
          category && category !== 'all'
            ? { category }
            : undefined,
        signal,
      },
    )

  return response.data
}

export async function getLiveStreamById(
  streamId: string,
  signal?: AbortSignal,
): Promise<LiveStreamDetails> {
  const response =
    await axios.get<LiveStreamDetails>(
      `/api/v1/streams/${streamId}`,
      {
        signal,
      },
    )

  return response.data
}

export async function getStreamCategories(
  signal?: AbortSignal,
): Promise<StreamCategory[]> {
  const response =
    await axios.get<StreamCategory[]>(
      '/api/v1/streams/categories',
      {
        signal,
      },
    )

  return response.data
}
