import type {
  CancellationSignal,
} from '../common/cancellation'
import type {
  LiveStreamDetails,
  LiveStreamListItem,
  StreamCategory,
} from '../../domain/stream/types'
import type {
  StreamGateway,
} from './gateway'

export interface StreamService {
  getLiveStreams(
    category?: string,
    signal?: CancellationSignal,
  ): Promise<LiveStreamListItem[]>

  getLiveStreamById(
    streamId: string,
    signal?: CancellationSignal,
  ): Promise<LiveStreamDetails>

  getStreamCategories(
    signal?: CancellationSignal,
  ): Promise<StreamCategory[]>
}

export function createStreamService(
  gateway: StreamGateway,
): StreamService {
  return {
    getLiveStreams:
      gateway.getLiveStreams,

    getLiveStreamById:
      gateway.getLiveStreamById,

    getStreamCategories:
      gateway.getStreamCategories,
  }
}
