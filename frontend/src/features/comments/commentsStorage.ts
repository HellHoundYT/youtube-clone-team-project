import type {
  KeyValueStore,
} from '../../shared/storage/keyValueStore'

let configuredCommentsStorage:
KeyValueStore | null = null

export function configureCommentsStorage(
  storage:
    KeyValueStore,
) {
  configuredCommentsStorage =
    storage
}

export function getCommentsStorage():
KeyValueStore {
  if (!configuredCommentsStorage) {
    throw new Error(
      'Comments storage is not configured.',
    )
  }

  return configuredCommentsStorage
}
