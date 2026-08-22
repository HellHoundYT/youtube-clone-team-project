import axios from 'axios'

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

export interface VideoDetails extends VideoListItem {
  description: string | null
  videoPath: string
  visibility: string
}

export interface GetVideosParams {
  page?: number
  pageSize?: number
  category?: string
}

export async function getVideos(
  params: GetVideosParams = {},
  signal?: AbortSignal,
): Promise<VideoListItem[]> {
  const response = await axios.get<VideoListItem[]>(
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
  const response = await axios.get<VideoDetails>(
    `/api/v1/videos/${videoId}`,
    {
      signal,
    },
  )

  return response.data
}