import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock('axios', () => ({ default: axiosMock }))

import { authGateway } from './auth'

const user = {
  id: 'user-1',
  email: 'tetiana@example.com',
  displayName: 'Tetiana',
  handle: '@tetiana',
  bio: '',
}

async function signIn() {
  axiosMock.post.mockResolvedValue({
    data: {
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    },
  })

  await authGateway.signIn({
    email: user.email,
    password: 'safe-password',
  })
}

describe('authGateway profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    axiosMock.post.mockResolvedValue({})
    await authGateway.signOut()
  })

  it('gets the authenticated user with the access token', async () => {
    await signIn()
    axiosMock.get.mockResolvedValue({ data: user })

    await expect(authGateway.getCurrentUser()).resolves.toEqual(user)

    expect(axiosMock.get).toHaveBeenCalledWith(
      '/api/v1/users/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer access-token' },
        withCredentials: true,
      }),
    )
  })

  it('returns null when the current user request fails', async () => {
    axiosMock.get.mockRejectedValue(new Error('Unauthorized'))

    await expect(authGateway.getCurrentUser()).resolves.toBeNull()
  })

  it('updates the profile through the protected profile endpoint', async () => {
    await signIn()
    const update = {
      email: 'updated@example.com',
      displayName: 'Updated creator',
      handle: '@updated_creator',
      bio: 'I make videos.',
    }
    axiosMock.put.mockResolvedValue({ data: update })

    await expect(authGateway.updateCurrentUser(update)).resolves.toEqual(update)

    expect(axiosMock.put).toHaveBeenCalledWith(
      '/api/v1/users/me',
      update,
      expect.objectContaining({
        headers: { Authorization: 'Bearer access-token' },
        withCredentials: true,
      }),
    )
  })
})
