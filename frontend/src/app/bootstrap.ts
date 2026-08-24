import {
  configureCommentsStorage,
} from '../features/comments/commentsStorage'
import {
  configureAuthStore,
} from '../features/auth/authStore'
import {
  configureChannelStoreStorage,
} from '../features/channels/channelStore'
import {
  configurePlaylistStoreStorage,
} from '../features/playlists/playlistStore'
import {
  browserKeyValueStore,
} from '../infrastructure/storage/browserKeyValueStore'
import {
  initializeAppI18n,
} from '../shared/i18n'
import {
  authService,
} from './dependencies'

export async function initializeApplication() {
  configureAuthStore(
    authService,
  )

  configureChannelStoreStorage(
    browserKeyValueStore,
  )

  configurePlaylistStoreStorage(
    browserKeyValueStore,
  )

  configureCommentsStorage(
    browserKeyValueStore,
  )

  await initializeAppI18n(
    browserKeyValueStore,
  )
}
