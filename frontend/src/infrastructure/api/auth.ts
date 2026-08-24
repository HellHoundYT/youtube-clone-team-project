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

interface AuthResponse {
  user: User
  accessToken: string
}

let accessToken:
string | null = null

function setAccessToken(
  token: string | null,
) {
  accessToken =
    token
}

function authorizedConfig() {
  if (!accessToken) {
    throw new Error(
      'No authenticated user.',
    )
  }

  return {
    headers: {
      Authorization:
        `Bearer ${accessToken}`,
    },
  }
}

function optionalAuthorizedConfig() {
  return accessToken
    ? {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    : {}
}

export const authGateway:
AuthGateway = {
  async getCurrentUser() {
    try {
      const response =
        await axios.get<User>(
          '/api/v1/users/me',
          {
            withCredentials:
              true,

            ...optionalAuthorizedConfig(),
          },
        )

      return response.data
    } catch {
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
      await axios.put<User>(
        '/api/v1/users/me',
        request,
        {
          withCredentials:
            true,

          ...authorizedConfig(),
        },
      )

    return response.data
  },

  async signOut() {
    await axios.post(
      '/api/v1/auth/logout',
      undefined,
      {
        withCredentials:
          true,
      },
    )

    setAccessToken(
      null,
    )
  },
}
