import {
  create,
} from 'zustand'
import type {
  AuthService,
} from '../../../application/auth/service'
import type {
  RegisterRequest,
  UpdateUserRequest,
} from '../../../application/auth/types'
import type {
  User,
} from '../../../domain/user/types'
import {
  useThemeStore,
} from '../../../shared/theme/useThemeStore'

export type AccountProfile =
  User

interface AuthState {
  profile:
    AccountProfile | null

  isLoading:
    boolean

  loadCurrentUser:
    () => Promise<void>

  signIn:
    (
      email: string,
      password: string,
    ) => Promise<void>

  register:
    (
      request:
        RegisterRequest,
    ) => Promise<void>

  updateProfile:
    (
      request:
        UpdateUserRequest,
    ) => Promise<void>

  uploadAvatar:
    (file: File) => Promise<void>

  signOut:
    () => Promise<void>
}

let configuredAuthService:
AuthService | null = null

export function configureAuthStore(
  authService: AuthService,
) {
  configuredAuthService =
    authService
}

function getAuthService():
AuthService {
  if (!configuredAuthService) {
    throw new Error(
      'Auth store is not configured.',
    )
  }

  return configuredAuthService
}

function applyProfileTheme(
  user: User | null,
) {
  if (user?.themeId) {
    useThemeStore
      .getState()
      .applyThemeFromProfile(
        user.themeId,
      )
  }
}

export const useAuthStore =
  create<AuthState>(
    (set) => ({
      profile: null,

      isLoading: true,

      loadCurrentUser:
        async () => {
          try {
            const user =
              await getAuthService()
                .getCurrentUser()

            set({
              profile:
                user,
            })
            applyProfileTheme(user)
          } finally {
            set({
              isLoading:
                false,
            })
          }
        },

      signIn:
        async (
          email,
          password,
        ) => {
          const user =
            await getAuthService()
              .signIn({
                email,
                password,
              })

          set({
            profile:
              user,
            isLoading:
              false,
          })
          applyProfileTheme(user)
        },

      register:
        async (
          request,
        ) => {
          const user =
            await getAuthService()
              .register(
                request,
              )

          set({
            profile:
              user,
            isLoading:
              false,
          })
          applyProfileTheme(user)
        },

      updateProfile:
        async (
          request,
        ) => {
          const user =
            await getAuthService()
              .updateCurrentUser(
                request,
              )

          set({
            profile:
              user,
          })
          applyProfileTheme(user)
        },

      uploadAvatar:
        async (
          file,
        ) => {
          const user =
            await getAuthService()
              .uploadAvatar(file)

          set({
            profile:
              user,
          })
        },

      signOut:
        async () => {
          await getAuthService()
            .signOut()

          set({
            profile:
              null,
            isLoading:
              false,
          })
        },
    }),
  )
