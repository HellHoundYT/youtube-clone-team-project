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

let accessToken:
string | null = null

let refreshToken:
string | null = null

const refreshTokenStorageKey =
  'amtlis.auth.refresh-token'

function getStoredRefreshToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage.getItem(
    refreshTokenStorageKey,
  )
}

function setAccessToken(
  token: string | null,
) {
  accessToken = token
}

function setRefreshToken(
  token: string | null,
) {
  refreshToken = token

  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.sessionStorage.setItem(
      refreshTokenStorageKey,
      token,
    )
  } else {
    window.sessionStorage.removeItem(
      refreshTokenStorageKey,
    )
  }
}

function setSession(
  response: AuthResponse,
) {
  setAccessToken(
    response.accessToken,
  )
  setRefreshToken(
    response.refreshToken,
  )
}

function clearSession() {
  setAccessToken(
    null,
  )
  setRefreshToken(
    null,
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

async function refreshSession(): Promise<User | null> {
  const token =
    refreshToken ??
    getStoredRefreshToken()

  if (!token) {
    return null
  }

  try {
    const response =
      await axios.post<AuthResponse>(
        '/api/v1/auth/refresh',
        {
          refreshToken: token,
        },
        {
          withCredentials: true,
        },
      )

    setSession(
      response.data,
    )

    return response.data.user
  } catch {
    clearSession()
    return null
  }
}

async function ensureAccessToken() {
  if (accessToken) {
    return true
  }

  return Boolean(
    await refreshSession(),
  )
}

async function authorizedRequest<T>(
  request: () => Promise<T>,
) {
  if (!await ensureAccessToken()) {
    throw new Error(
      'No authenticated user.',
    )
  }

  try {
    return await request()
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      await refreshSession()
    ) {
      return request()
    }

    throw error
  }
}

export const authGateway:
AuthGateway = {
  async restoreSession() {
    const restoredUser =
      await refreshSession()

    if (!restoredUser) {
      return null
    }

    return this.getCurrentUser()
  },

  async getCurrentUser() {
    try {
      return await authorizedRequest(
        async () => {
          const response =
            await axios.get<User>(
              '/api/v1/users/me',
              {
                withCredentials: true,
                ...authorizedConfig(),
              },
            )

          return response.data
        },
      )
    } catch {
      return null
    }
  },

  async signIn(
    request: SignInRequest,
  ) {
    const response =
      await axios.post<AuthResponse>(
        '/api/v1/auth/login',
        request,
        {
          withCredentials: true,
        },
      )

    setSession(
      response.data,
    )

    return response.data.user
  },

  async register(
    request: RegisterRequest,
  ) {
    const response =
      await axios.post<AuthResponse>(
        '/api/v1/auth/register',
        request,
        {
          withCredentials: true,
        },
      )

    setSession(
      response.data,
    )

    return response.data.user
  },

  async updateCurrentUser(
    request: UpdateUserRequest,
  ) {
    return authorizedRequest(
      async () => {
        const response =
          await axios.put<User>(
            '/api/v1/users/me',
            request,
            {
              withCredentials: true,
              ...authorizedConfig(),
            },
          )

        return response.data
      },
    )
  },

  async signOut() {
    const token =
      refreshToken ??
      getStoredRefreshToken()

    if (!token) {
      clearSession()
      return
    }

    try {
      await authorizedRequest(
        () => axios.post(
          '/api/v1/auth/logout',
          {
            refreshToken: token,
          },
          {
            withCredentials: true,
            ...authorizedConfig(),
          },
        ),
      )
    } finally {
      clearSession()
    }
  },
}
