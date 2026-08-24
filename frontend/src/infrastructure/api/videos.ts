import axios, {
  type AxiosProgressEvent,
} from 'axios'
import type {
  VideoDetails,
  VideoListItem,
  VideoReactionType,
} from '../../domain/video/types'

export type {
  VideoDetails,
  VideoListItem,
  VideoReactionType,
} from '../../domain/video/types'

export interface GetVideosParams {
  page?: number
  pageSize?: number
  category?: string
}

export interface UploadVideoRequest {
  title: string
  description: string
  category: string
  durationSeconds: number
  file: File
}

export async function getVideos(
  params: GetVideosParams = {},
  signal?: AbortSignal,
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
  signal?: AbortSignal,
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

export async function getVideoRecommendations(
  video: VideoDetails,
  signal?: AbortSignal,
): Promise<VideoListItem[]> {
  const recommendations =
    new Map<string, VideoListItem>()

  if (video.category) {
    const categoryVideos =
      await getVideos(
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
      await getVideos(
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

export async function uploadVideo(
  request: UploadVideoRequest,
  onProgress?: (
    progress: number,
  ) => void,
): Promise<VideoDetails> {
  const formData =
    new FormData()

  formData.append(
    'title',
    request.title,
  )

  formData.append(
    'description',
    request.description,
  )

  formData.append(
    'category',
    request.category,
  )

  formData.append(
    'durationSeconds',
    request.durationSeconds.toString(),
  )

  formData.append(
    'file',
    request.file,
  )

  const response =
    await axios.post<VideoDetails>(
      '/api/v1/videos/upload',
      formData,
      {
        onUploadProgress: (
          event:
            AxiosProgressEvent,
        ) => {
          if (!event.total) {
            return
          }

          const progress =
            Math.round(
              (event.loaded /
                event.total) *
                100,
            )

          onProgress?.(
            Math.min(
              progress,
              100,
            ),
          )
        },
      },
    )

  return response.data
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