import type {
  User,
} from '../../domain/user/types'
import type {
  RegisterRequest,
  SignInRequest,
  UpdateUserRequest,
} from './types'

export interface AuthGateway {
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
