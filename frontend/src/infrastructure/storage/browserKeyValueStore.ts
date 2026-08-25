import type {
  KeyValueStore,
} from '../../shared/storage/keyValueStore'

export const browserKeyValueStore:
KeyValueStore = {
  getItem(
    key: string,
  ) {
    if (
      typeof window ===
      'undefined'
    ) {
      return null
    }

    return window.localStorage
      .getItem(
        key,
      )
  },

  setItem(
    key: string,
    value: string,
  ) {
    if (
      typeof window ===
      'undefined'
    ) {
      return
    }

    window.localStorage
      .setItem(
        key,
        value,
      )
  },

  removeItem(
    key: string,
  ) {
    if (
      typeof window ===
      'undefined'
    ) {
      return
    }

    window.localStorage
      .removeItem(
        key,
      )
  },
}
