import type {
  User,
} from '../../domain/user/types'
import type {
  AuthGateway,
} from './gateway'
import type {
  RegisterRequest,
  SignInRequest,
  UpdateUserRequest,
} from './types'

export interface AuthService {
  getCurrentUser():
  Promise<User | null>

  signIn(
    request: SignInRequest,
  ): Promise<User>

  register(
    request: RegisterRequest,
  ): Promise<User>

  updateCurrentUser(
    request: UpdateUserRequest,
  ): Promise<User>

  signOut(): Promise<void>
}

export function createAuthService(
  gateway: AuthGateway,
): AuthService {
  return {
    getCurrentUser:
      gateway.getCurrentUser,

    signIn:
      gateway.signIn,

    register:
      gateway.register,

    updateCurrentUser:
      gateway.updateCurrentUser,

    signOut:
      gateway.signOut,
  }
}
