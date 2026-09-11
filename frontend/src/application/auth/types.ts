export interface SignInRequest {
  email: string
  password: string
}

export interface RegisterRequest
extends SignInRequest {
  displayName: string
}

export interface UpdateUserRequest {
  displayName: string
  email: string
  handle: string
  bio: string
  avatarDataUrl: string | null
  themeId: string | null
}
