import type {
  CancellationSignal,
} from '../common/cancellation'
import type {
  VideoDetails,
  VideoListItem,
  VideoReactionType,
} from '../../domain/video/types'
import type {
  VideoGateway,
} from './gateway'
import type {
  GetVideosParams,
} from './types'

export interface VideoService {
  getVideos(
    params?: GetVideosParams,
    signal?: CancellationSignal,
  ): Promise<VideoListItem[]>

  getVideoById(
    videoId: string,
    signal?: CancellationSignal,
  ): Promise<VideoDetails>

  getVideoRecommendations(
    video: VideoDetails,
    signal?: CancellationSignal,
  ): Promise<VideoListItem[]>

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

export function createVideoService(
  gateway: VideoGateway,
): VideoService {
  const getVideoRecommendations =
    async (
      video: VideoDetails,
      signal?: CancellationSignal,
    ): Promise<VideoListItem[]> => {
      const recommendations =
        new Map<string, VideoListItem>()

      if (video.category) {
        const categoryVideos =
          await gateway.getVideos(
            {
              page: 1,
              pageSize: 12,
              category: video.category,
            },
            signal,
          )

        for (const item of categoryVideos) {
          if (item.id !== video.id) {
            recommendations.set(
              item.id,
              item,
            )
          }
        }
      }

      if (recommendations.size < 5) {
        const allVideos =
          await gateway.getVideos(
            {
              page: 1,
              pageSize: 50,
            },
            signal,
          )

        for (const item of allVideos) {
          if (item.id !== video.id) {
            recommendations.set(
              item.id,
              item,
            )
          }
        }
      }

      return [
        ...recommendations.values(),
      ]
        .sort(
          (left, right) =>
            right.viewCount -
            left.viewCount,
        )
        .slice(0, 5)
    }

  return {
    getVideos:
      gateway.getVideos,

    getVideoById:
      gateway.getVideoById,

    getVideoRecommendations,

    registerVideoView:
      gateway.registerVideoView,

    setVideoReaction:
      gateway.setVideoReaction,

    removeVideoReaction:
      gateway.removeVideoReaction,
  }
}
