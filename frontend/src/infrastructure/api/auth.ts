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
  refreshToken: string
}

const accessTokenStorageKey =
  'amtlis.access-token'

const refreshTokenStorageKey =
  'amtlis.refresh-token'

function readSessionToken(
  key: string,
) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function saveSessionToken(
  key: string,
  token: string | null,
) {
  try {
    if (token) {
      window.sessionStorage.setItem(key, token)
      return
    }

    window.sessionStorage.removeItem(key)
  } catch {
    // The application can still use the token in memory when storage is unavailable.
  }
}

let accessToken:
string | null = readSessionToken(accessTokenStorageKey)

let refreshToken:
string | null = readSessionToken(refreshTokenStorageKey)

function setAccessToken(
  token: string | null,
) {
  accessToken =
    token
  saveSessionToken(
    accessTokenStorageKey,
    token,
  )
}

function setRefreshToken(
  token: string | null,
) {
  refreshToken = token
  saveSessionToken(
    refreshTokenStorageKey,
    token,
  )
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
    setRefreshToken(
      response.data.refreshToken,
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
    setRefreshToken(
      response.data.refreshToken,
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
    try {
      if (refreshToken) {
        await axios.post(
          '/api/v1/auth/logout',
          { refreshToken },
          {
            withCredentials:
              true,

            ...authorizedConfig(),
          },
        )
      }
    } finally {
      setAccessToken(
        null,
      )
      setRefreshToken(
        null,
      )
    }
  },
}
