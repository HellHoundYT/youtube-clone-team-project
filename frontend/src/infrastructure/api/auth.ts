import axios from 'axios'
import type {
  AuthGateway,
} from '../../application/auth/gateway'
import type {
  RegisterRequest,
  SignInRequest,
  UpdateUserRequest,
} from '../../application/auth/types'
import type {
  User,
} from '../../domain/user/types'
import {
  clearAccessToken,
  createAuthorizedConfig,
  setAccessToken,
  withAuthenticatedRequest,
} from './authSession'

interface AuthResponse {
  user: User
  accessToken: string
}

export const authGateway:
AuthGateway = {
  async getCurrentUser() {
    try {
      const response =
        await withAuthenticatedRequest(
          (token) =>
            axios.get<User>(
              '/api/v1/users/me',
              {
                withCredentials:
                  true,

                ...createAuthorizedConfig(token),
              },
            ),
        )

      return response.data
    } catch {
      clearAccessToken()
      return null
    }
  },

  async signIn(
    request:
      SignInRequest,
  ) {
    const response =
      await axios.post<AuthResponse>(
        '/api/v1/auth/login',
        request,
        {
          withCredentials:
            true,
        },
      )

    setAccessToken(
      response.data.accessToken,
    )

    return response.data.user
  },

  async register(
    request:
      RegisterRequest,
  ) {
    const response =
      await axios.post<AuthResponse>(
        '/api/v1/auth/register',
        request,
        {
          withCredentials:
            true,
        },
      )

    setAccessToken(
      response.data.accessToken,
    )

    return response.data.user
  },

  async updateCurrentUser(
    request:
      UpdateUserRequest,
  ) {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.put<User>(
            '/api/v1/users/me',
            request,
            {
              withCredentials:
                true,

              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },

  async uploadAvatar(
    file: File,
  ) {
    const form = new FormData()
    form.append('file', file)

    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.post<User>(
            '/api/v1/users/me/avatar',
            form,
            {
              withCredentials:
                true,

              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },

  async signOut() {
    try {
      await axios.post(
        '/api/v1/auth/logout',
        undefined,
        {
          withCredentials:
            true,
        },
      )
    } finally {
      clearAccessToken()
    }
  },
}
