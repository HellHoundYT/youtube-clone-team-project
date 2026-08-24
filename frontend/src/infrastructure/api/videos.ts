import axios from 'axios'
import type {
  CancellationSignal,
} from '../../application/common/cancellation'
import type {
  VideoGateway,
} from '../../application/video/gateway'
import type {
  GetVideosParams,
} from '../../application/video/types'
import type {
  VideoDetails,
  VideoListItem,
  VideoReactionType,
} from '../../domain/video/types'

export async function getVideos(
  params: GetVideosParams = {},
  signal?: CancellationSignal,
): Promise<VideoListItem[]> {
  const response =
    await axios.get<VideoListItem[]>(
      '/api/v1/videos',
      {
        params,
        signal,
      },
    )

  return response.data
}

export async function getVideoById(
  videoId: string,
  signal?: CancellationSignal,
): Promise<VideoDetails> {
  const response =
    await axios.get<VideoDetails>(
      `/api/v1/videos/${videoId}`,
      {
        signal,
      },
    )

  return response.data
}

export async function registerVideoView(
  videoId: string,
): Promise<void> {
  await axios.post(
    `/api/v1/videos/${videoId}/view`,
  )
}

export async function setVideoReaction(
  videoId: string,
  type: VideoReactionType,
): Promise<void> {
  await axios.put(
    `/api/v1/videos/${videoId}/reaction`,
    {
      type,
    },
  )
}

export async function removeVideoReaction(
  videoId: string,
): Promise<void> {
  await axios.delete(
    `/api/v1/videos/${videoId}/reaction`,
  )
}

export const videoGateway:
VideoGateway = {
  getVideos,
  getVideoById,
  registerVideoView,
  setVideoReaction,
  removeVideoReaction,
}
