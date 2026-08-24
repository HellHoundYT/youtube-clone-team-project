import type {
  CancellationSignal,
} from '../common/cancellation'
import type {
  LiveStreamDetails,
  LiveStreamListItem,
  StreamCategory,
} from '../../domain/stream/types'

export interface StreamGateway {
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
