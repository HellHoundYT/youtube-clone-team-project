import axios from 'axios'
import type {
  CancellationSignal,
} from '../../application/common/cancellation'
import type {
  StreamGateway,
} from '../../application/stream/gateway'
import type {
  LiveStreamDetails,
  LiveStreamListItem,
  StreamCategory,
} from '../../domain/stream/types'

export async function getLiveStreams(
  category?: string,
  signal?: CancellationSignal,
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
  signal?: CancellationSignal,
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
  signal?: CancellationSignal,
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

export const streamGateway:
StreamGateway = {
  getLiveStreams,
  getLiveStreamById,
  getStreamCategories,
}
