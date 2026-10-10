import {
  configureAuthStore,
  useAuthStore,
} from '../presentation/features/auth/authStore'
import {
  configureCommentService,
} from '../presentation/features/comments/commentServiceProvider'
import {
  configureSocialStore,
} from '../presentation/features/social/socialStore'
import {
  browserKeyValueStore,
} from '../infrastructure/storage/browserKeyValueStore'
import {
  initializeAppI18n,
} from '../shared/i18n'
import {
  configureThemeProfileSync,
} from '../shared/theme/useThemeStore'
import {
  authService,
  commentService,
  socialService,
} from './dependencies'

export async function initializeApplication() {
  configureAuthStore(
    authService,
  )

  configureCommentService(
    commentService,
  )

  configureSocialStore(
    socialService,
  )

  configureThemeProfileSync(
    async (
      themeId,
    ) => {
      const state =
        useAuthStore.getState()
      const profile =
        state.profile

      if (!profile) {
        return
      }

      await state.updateProfile({
        displayName:
          profile.displayName,
        email:
          profile.email,
        handle:
          profile.handle,
        bio:
          profile.bio,
        themeId,
      })
    },
  )

  await initializeAppI18n(
    browserKeyValueStore,
  )
}
