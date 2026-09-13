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
}

let accessToken:
string | null = null

let refreshPromise:
Promise<string> | null = null

function setAccessToken(
  token: string | null,
) {
  accessToken = token
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
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise =
    (async () => {
      const response =
        await axios.post<AuthResponse>(
          '/api/v1/auth/refresh',
          undefined,
          {
            withCredentials:
              true,
          },
        )

      setAccessToken(
        response.data.accessToken,
      )

      return response.data.accessToken
    })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function withAuthenticatedRequest<T>(
  request: (
    token: string,
  ) => Promise<AxiosResponse<T>>,
) {
  const token =
    accessToken ??
    await refreshAccessToken()

  try {
    return await request(token)
  } catch (error) {
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401
    ) {
      throw error
    }

    setAccessToken(null)

    return request(
      await refreshAccessToken(),
    )
  }
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

                ...authorizedConfig(token),
              },
            ),
        )

      return response.data
    } catch {
      setAccessToken(null)
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

              ...authorizedConfig(token),
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
      setAccessToken(null)
    }
  },
}
