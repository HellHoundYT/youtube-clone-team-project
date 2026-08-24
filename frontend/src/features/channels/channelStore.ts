import {
  create,
} from 'zustand'

interface ChannelState {
  subscribedChannelIds: string[]
  toggleSubscription: (channelId: string) => void
  isSubscribed: (channelId: string) => boolean
}

const storageKey =
  'amtlis.channel-subscriptions'

function readSubscriptions() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const value =
      window.localStorage.getItem(storageKey)
    const parsed = value
      ? JSON.parse(value)
      : []

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function saveSubscriptions(
  channelIds: string[],
) {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify(channelIds),
  )
}

export const useChannelStore =
  create<ChannelState>((set, get) => ({
    subscribedChannelIds: readSubscriptions(),

    toggleSubscription: (channelId) => {
      const current =
        get().subscribedChannelIds
      const next = current.includes(channelId)
        ? current.filter((id) => id !== channelId)
        : [...current, channelId]

      saveSubscriptions(next)
      set({ subscribedChannelIds: next })
    },

    isSubscribed: (channelId) =>
      get()
        .subscribedChannelIds
        .includes(channelId),
  }))
