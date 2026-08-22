import axios, {
  type AxiosProgressEvent,
} from 'axios'

export interface VideoListItem {
  id: string
  channelId: string
  channelName: string
  channelAvatarPath: string | null
  category: string | null
  categorySlug: string | null
  title: string
  thumbnailPath: string | null
  durationSeconds: number
  viewCount: number
  publishedAt: string | null
}

export interface VideoDetails
  extends VideoListItem {
  description: string | null
  videoPath: string
  visibility: string
}

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

export type VideoReactionType =
  | 'Like'
  | 'Dislike'

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