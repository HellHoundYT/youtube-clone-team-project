// @vitest-environment jsdom

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

const axiosMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  isAxiosError: vi.fn(),
}

vi.mock(
  'axios',
  () => ({
    default: axiosMock,
  }),
)

const user = {
  id: 'user-1',
  email: 'user@example.com',
  displayName: 'User',
  handle: '@user',
  bio: '',
  avatarDataUrl: null,
  themeId: null,
}

describe(
  'authGateway',
  () => {
    beforeEach(() => {
      window.sessionStorage.clear()
      vi.resetModules()
      vi.clearAllMocks()
    })

    it(
      'refreshes the access token and retries a request after 401',
      async () => {
        axiosMock.post
          .mockResolvedValueOnce({
            data: {
              user,
              accessToken: 'access-1',
              refreshToken: 'refresh-1',
            },
          })
          .mockResolvedValueOnce({
            data: {
              user,
              accessToken: 'access-2',
              refreshToken: 'refresh-2',
            },
          })
        axiosMock.get
          .mockRejectedValueOnce({
            response: {
              status: 401,
            },
          })
          .mockResolvedValueOnce({
            data: user,
          })
        axiosMock.isAxiosError.mockReturnValue(true)

        const {
          authGateway,
        } = await import('./auth')

        await authGateway.signIn({
          email: user.email,
          password: 'password',
        })

        await expect(
          authGateway.getCurrentUser(),
        ).resolves.toEqual(user)

        expect(axiosMock.post).toHaveBeenLastCalledWith(
          '/api/v1/auth/refresh',
          {
            refreshToken: 'refresh-1',
          },
          {
            withCredentials: true,
          },
        )
        expect(axiosMock.get).toHaveBeenLastCalledWith(
          '/api/v1/users/me',
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer access-2',
            },
          }),
        )
      },

    )

    it(
      'restores a session using the saved refresh token',
      async () => {
        window.sessionStorage.setItem(
          'amtlis.refresh-token',
          'refresh-1',
        )
        axiosMock.post.mockResolvedValue({
          data: {
            user,
            accessToken: 'access-2',
            refreshToken: 'refresh-2',
          },
        })
        axiosMock.get.mockResolvedValue({
          data: user,
        })

        const {
          authGateway,
        } = await import('./auth')

        await expect(
          authGateway.getCurrentUser(),
        ).resolves.toEqual(user)

        expect(axiosMock.post).toHaveBeenCalledWith(
          '/api/v1/auth/refresh',
          {
            refreshToken: 'refresh-1',
          },
          {
            withCredentials: true,
          },
        )
        expect(
          window.sessionStorage.getItem(
            'amtlis.access-token',
          ),
        ).toBe('access-2')
      },
    )

    it(
      'sends avatar and theme preferences to the profile API',
      async () => {
        axiosMock.post.mockResolvedValue({
          data: { user, accessToken: 'access-1', refreshToken: 'refresh-1' },
        })
        axiosMock.put.mockResolvedValue({
          data: { ...user, avatarDataUrl: 'data:image/png;base64,AA==', themeId: 'cyber-red' },
        })

        const { authGateway } = await import('./auth')
        await authGateway.signIn({ email: user.email, password: 'password' })
        await authGateway.updateCurrentUser({
          ...user,
          avatarDataUrl: 'data:image/png;base64,AA==',
          themeId: 'cyber-red',
        })

        expect(axiosMock.put).toHaveBeenCalledWith(
          '/api/v1/users/me',
          expect.objectContaining({ themeId: 'cyber-red' }),
          expect.objectContaining({ headers: { Authorization: 'Bearer access-1' } }),
        )
      },
    )
  },
)
