// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const axiosMock =
  vi.hoisted(
    () => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      isAxiosError: vi.fn(),
    }),
  )

vi.mock(
  'axios',
  () => ({
    default: axiosMock,
  }),
)

import {
  authGateway,
} from './auth'

const user = {
  id: 'user-1',
  email: 'tetiana@example.com',
  displayName: 'Tetiana',
  handle: '@tetiana',
  bio: '',
}

describe(
  'authGateway',
  () => {
    beforeEach(() => {
      window.sessionStorage.clear()
      vi.clearAllMocks()
    })

    afterEach(async () => {
      await authGateway.signOut()
    })

    it(
      'stores the refresh token after sign-in',
      async () => {
        axiosMock.post.mockResolvedValue({
          data: {
            user,
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        })

        await expect(
          authGateway.signIn({
            email: user.email,
            password: 'password',
          }),
        ).resolves.toEqual(user)

        expect(
          window.sessionStorage.getItem(
            'amtlis.auth.refresh-token',
          ),
        ).toBe('refresh-token')
      },
    )

    it(
      'restores a session with refresh and current-user requests',
      async () => {
        window.sessionStorage.setItem(
          'amtlis.auth.refresh-token',
          'stored-refresh-token',
        )
        axiosMock.post.mockResolvedValue({
          data: {
            user,
            accessToken: 'restored-access-token',
            refreshToken: 'rotated-refresh-token',
          },
        })
        axiosMock.get.mockResolvedValue({
          data: user,
        })

        await expect(
          authGateway.restoreSession(),
        ).resolves.toEqual(user)

        expect(
          axiosMock.post,
        ).toHaveBeenCalledWith(
          '/api/v1/auth/refresh',
          {
            refreshToken: 'stored-refresh-token',
          },
          {
            withCredentials: true,
          },
        )
        expect(
          axiosMock.get,
        ).toHaveBeenCalledWith(
          '/api/v1/users/me',
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer restored-access-token',
            },
          }),
        )
      },
    )
  },
)
