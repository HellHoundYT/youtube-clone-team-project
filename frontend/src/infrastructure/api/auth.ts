import axios, {
  type AxiosResponse,
} from 'axios'
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
    // The token remains available in memory when storage is unavailable.
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

function authorizedConfig(
  token: string,
) {
  return {
    headers: {
      Authorization:
        `Bearer ${token}`,
    },
  }
}

async function refreshAccessToken() {
  if (!refreshToken) {
    throw new Error(
      'No refresh token is available.',
    )
  }

  const response =
    await axios.post<AuthResponse>(
      '/api/v1/auth/refresh',
      { refreshToken },
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

  return response.data.accessToken
}

async function withAuthenticatedRequest<T>(
  request: (token: string) => Promise<AxiosResponse<T>>,
) {
  const token =
    accessToken ?? await refreshAccessToken()

  try {
    return await request(token)
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error
    }

    return request(
      await refreshAccessToken(),
    )
  }
}

export const authGateway:
AuthGateway = {
  async getCurrentUser() {
    if (!accessToken && !refreshToken) {
      return null
    }

    try {
      const response =
        await withAuthenticatedRequest((token) => axios.get<User>(
          '/api/v1/users/me',
          {
            withCredentials:
              true,

            ...authorizedConfig(token),
          },
        ))

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
      await withAuthenticatedRequest((token) => axios.put<User>(
        '/api/v1/users/me',
        request,
        {
          withCredentials:
            true,

          ...authorizedConfig(token),
        },
      ))

    return response.data
  },

  async signOut() {
    try {
      if (refreshToken) {
        await withAuthenticatedRequest((token) => axios.post(
          '/api/v1/auth/logout',
          { refreshToken },
          {
            withCredentials:
              true,

            ...authorizedConfig(token),
          },
        ))
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
