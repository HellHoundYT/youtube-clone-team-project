import axios from 'axios'

export interface LiveStreamListItem {
  id: string
  channelId: string
  channelName: string
  channelAvatarPath: string | null
  title: string
  category: string
  categorySlug: string
  thumbnailPath: string | null
  viewerCount: number
  isLive: boolean
  startedAt: string
}

export interface LiveStreamDetails
  extends LiveStreamListItem {
  description: string
  playbackUrl: string
  tags: string[]
}

export interface StreamCategory {
  name: string
  slug: string
  liveStreamCount: number
  viewerCount: number
}

export async function getLiveStreams(
  category?: string,
  signal?: AbortSignal,
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
  signal?: AbortSignal,
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
  signal?: AbortSignal,
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