// @vitest-environment jsdom

import {
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
  isAxiosError: vi.fn(),
}))

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
  avatarUrl: null,
  themeId: null,
}

describe(
  'authGateway',
  () => {
    beforeEach(() => {
      vi.resetModules()
      vi.clearAllMocks()
    })

    it(
      'restores a session through the refresh cookie',
      async () => {
        axiosMock.post.mockResolvedValue({
          data: {
            user,
            accessToken: 'access-2',
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
          undefined,
          {
            withCredentials: true,
          },
        )
        expect(axiosMock.get).toHaveBeenCalledWith(
          '/api/v1/users/me',
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer access-2',
            },
            withCredentials: true,
          }),
        )
      },
    )

    it(
      'refreshes the access token and retries after 401',
      async () => {
        axiosMock.post
          .mockResolvedValueOnce({
            data: {
              user,
              accessToken: 'access-1',
            },
          })
          .mockResolvedValueOnce({
            data: {
              user,
              accessToken: 'access-2',
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
          undefined,
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
  },
)
