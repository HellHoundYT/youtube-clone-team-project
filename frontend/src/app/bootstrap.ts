import {
  configureCommentsStorage,
} from '../presentation/features/comments/commentsStorage'
import {
  configureAuthStore,
} from '../presentation/features/auth/authStore'
import {
  configureChannelStoreStorage,
} from '../presentation/features/channels/channelStore'
import {
  configurePlaylistStoreStorage,
} from '../presentation/features/playlists/playlistStore'
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
