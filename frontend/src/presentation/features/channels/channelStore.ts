import {
  create,
} from 'zustand'
import type {
  KeyValueStore,
} from '../../../shared/storage/keyValueStore'

interface ChannelState {
  subscribedChannelIds: string[]

  toggleSubscription:
    (
      channelId: string,
    ) => void

  isSubscribed:
    (
      channelId: string,
    ) => boolean
}

const storageKey =
  'amtlis.channel-subscriptions'

let configuredStorage:
KeyValueStore | null = null

function getStorage():
KeyValueStore {
  if (!configuredStorage) {
    throw new Error(
      'Channel storage is not configured.',
    )
  }

  return configuredStorage
}

function readSubscriptions(
  storage:
    KeyValueStore,
) {
  try {
    const value =
      storage.getItem(
        storageKey,
      )

    const parsed =
      value
        ? JSON.parse(
            value,
          )
        : []

    return Array.isArray(
      parsed,
    )
      ? parsed.filter(
          (
            item,
          ): item is string =>
            typeof item ===
            'string',
        )
      : []
  } catch {
    return []
  }
}

function saveSubscriptions(
  channelIds: string[],
) {
  getStorage()
    .setItem(
      storageKey,
      JSON.stringify(
        channelIds,
      ),
    )
}

export const useChannelStore =
  create<ChannelState>(
    (
      set,
      get,
    ) => ({
      subscribedChannelIds:
        [],

      toggleSubscription:
        (
          channelId,
        ) => {
          const current =
            get()
              .subscribedChannelIds

          const next =
            current.includes(
              channelId,
            )
              ? current.filter(
                  (id) =>
                    id !==
                    channelId,
                )
              : [
                  ...current,
                  channelId,
                ]

          saveSubscriptions(
            next,
          )

          set({
            subscribedChannelIds:
              next,
          })
        },

      isSubscribed:
        (
          channelId,
        ) =>
          get()
            .subscribedChannelIds
            .includes(
              channelId,
            ),
    }),
  )

export function configureChannelStoreStorage(
  storage:
    KeyValueStore,
) {
  configuredStorage =
    storage

  useChannelStore.setState({
    subscribedChannelIds:
      readSubscriptions(
        storage,
      ),
  })
}
