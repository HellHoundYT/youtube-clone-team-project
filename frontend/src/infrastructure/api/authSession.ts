import axios, {
  type AxiosResponse,
} from 'axios'

interface RefreshResponse {
  accessToken: string
}

let accessToken:
string | null = null

let refreshPromise:
Promise<string> | null = null

export function setAccessToken(
  token: string | null,
) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
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
        await axios.post<RefreshResponse>(
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
  } catch (error) {
    clearAccessToken()
    throw error
  } finally {
    refreshPromise = null
  }
}

export async function withAuthenticatedRequest<T>(
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

    clearAccessToken()

    return request(
      await refreshAccessToken(),
    )
  }
}

export function createAuthorizedConfig(
  token: string,
) {
  return authorizedConfig(token)
}
