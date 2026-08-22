import axios from 'axios'

export interface VideoDetails {
  id: string
  channelId: string
  channelName: string
  channelAvatarPath: string | null
  category: string | null
  categorySlug: string | null
  title: string
  description: string | null
  videoPath: string
  thumbnailPath: string | null
  durationSeconds: number
  viewCount: number
  visibility: string
  publishedAt: string | null
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