import type {
  CancellationSignal,
} from '../common/cancellation'
import type {
  VideoDetails,
  VideoListItem,
  VideoReactionType,
} from '../../domain/video/types'
import type {
  GetVideosParams,
} from './types'

export interface VideoGateway {
  getVideos(
    params?: GetVideosParams,
    signal?: CancellationSignal,
  ): Promise<VideoListItem[]>

  getVideoById(
    videoId: string,
    signal?: CancellationSignal,
  ): Promise<VideoDetails>

  registerVideoView(
    videoId: string,
  ): Promise<void>

  setVideoReaction(
    videoId: string,
    type: VideoReactionType,
  ): Promise<void>

  removeVideoReaction(
    videoId: string,
  ): Promise<void>
}
