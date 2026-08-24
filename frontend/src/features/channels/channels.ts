import type {
  VideoListItem,
} from '../../infrastructure/api/videos'

export interface ChannelSummary {
  id: string
  name: string
  avatarPath: string | null
  description: string
  subscribers: string
}

const fallbackChannels: ChannelSummary[] = [
  { id: 'amtlis-studio', name: 'AMTLIS Studio', avatarPath: null, description: 'Original shows, interviews and curated premieres.', subscribers: '128K' },
  { id: 'pixel-quest', name: 'Pixel Quest', avatarPath: null, description: 'Games, guides and unforgettable adventures.', subscribers: '84K' },
  { id: 'sound-wave', name: 'Sound Wave', avatarPath: null, description: 'Fresh music, live sessions and playlists.', subscribers: '62K' },
  { id: 'code-craft', name: 'Code Craft', avatarPath: null, description: 'Practical programming for curious creators.', subscribers: '41K' },
]

export function getChannelsFromVideos(
  videos: VideoListItem[],
): ChannelSummary[] {
  const channels =
    new Map<string, ChannelSummary>()

  for (const video of videos) {
    if (!channels.has(video.channelId)) {
      channels.set(video.channelId, {
        id: video.channelId,
        name: video.channelName,
        avatarPath: video.channelAvatarPath,
        description: 'Videos and new releases from this creator.',
        subscribers: '—',
      })
    }
  }

  return channels.size > 0
    ? [...channels.values()]
    : fallbackChannels
}

export function getFallbackChannels() {
  return fallbackChannels
}
