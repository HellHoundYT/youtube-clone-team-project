import {
  create,
} from 'zustand'
import {
  authApi,
  type RegisterRequest,
  type UpdateUserRequest,
  type User,
} from '../../infrastructure/api/auth'

export type AccountProfile = User

interface AuthState {
  profile: AccountProfile | null
  loadCurrentUser: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  updateProfile: (request: UpdateUserRequest) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore =
  create<AuthState>((set) => ({
    profile: null,

    loadCurrentUser: async () => {
      const user = await authApi.getCurrentUser()
      set({ profile: user })
    },

    signIn: async (email, password) => {
      const session = await authApi.signIn({ email, password })
      set({ profile: session.user })
    },

    register: async (request) => {
      const session = await authApi.register(request)
      set({ profile: session.user })
    },

    updateProfile: async (request) => {
      const user = await authApi.updateCurrentUser(request)
      set({ profile: user })
    },

    signOut: async () => {
      await authApi.signOut()
      set({ profile: null })
    },
  }))
