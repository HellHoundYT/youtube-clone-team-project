import axios from 'axios'

export interface User {
  id: string
  email: string
  displayName: string
  handle: string
  bio: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface RegisterRequest extends SignInRequest {
  displayName: string
}

export interface UpdateUserRequest {
  displayName: string
  email: string
  handle: string
  bio: string
}

export interface AuthSession {
  user: User
  accessToken: string
}

interface AuthResponse {
  user: User
  accessToken: string
}

let accessToken: string | null = null

function setAccessToken(token: string | null) {
  accessToken = token
}

function authorizedConfig() {
  if (!accessToken) {
    throw new Error('No authenticated user.')
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
}

function optionalAuthorizedConfig() {
  return accessToken
    ? {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    : {}
}

/** HTTP Auth API adapter; user credentials never use Web Storage. */
export const authApi = {
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await axios.get<User>(
        '/api/v1/users/me',
        { withCredentials: true, ...optionalAuthorizedConfig() },
      )
      return response.data
    } catch {
      return null
    }
  },

  signIn: async (request: SignInRequest): Promise<AuthSession> => {
    const response = await axios.post<AuthResponse>(
      '/api/v1/auth/login', request, { withCredentials: true },
    )
    setAccessToken(response.data.accessToken)
    return response.data
  },

  register: async (request: RegisterRequest): Promise<AuthSession> => {
    const response = await axios.post<AuthResponse>(
      '/api/v1/auth/register', request, { withCredentials: true },
    )
    setAccessToken(response.data.accessToken)
    return response.data
  },

  updateCurrentUser: async (request: UpdateUserRequest): Promise<User> => {
    const response = await axios.put<User>(
      '/api/v1/users/me', request,
      { withCredentials: true, ...authorizedConfig() },
    )
    return response.data
  },

  signOut: async (): Promise<void> => {
    await axios.post('/api/v1/auth/logout', undefined, { withCredentials: true })
    setAccessToken(null)
  },
}
