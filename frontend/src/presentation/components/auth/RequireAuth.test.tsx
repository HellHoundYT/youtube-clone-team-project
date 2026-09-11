// @vitest-environment jsdom

import {
  cleanup,
  render,
  screen,
} from '@testing-library/react'
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import type {
  User,
} from '../../../domain/user/types'
import {
  useAuthStore,
} from '../../features/auth/authStore'
import RequireAuth from './RequireAuth'

const user: User = {
  id: 'user-1',
  email: 'user@example.com',
  displayName: 'User',
  handle: 'user',
  bio: '',
}

function AuthPage() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  return <p>Sign in from {from ?? 'none'}</p>
}

describe(
  'RequireAuth',
  () => {
    afterEach(() => {
      cleanup()
      useAuthStore.setState({
        profile: null,
        isLoading: true,
      })
    })

    it(
      'waits for session restoration before redirecting',
      () => {
        useAuthStore.setState({
          profile: null,
          isLoading: true,
        })

        renderRoutes()

        expect(screen.queryByText(/Sign in/)).toBeNull()
        expect(screen.queryByText('Protected page')).toBeNull()
      },
    )

    it(
      'redirects guests to auth and preserves the requested route',
      () => {
        useAuthStore.setState({
          profile: null,
          isLoading: false,
        })

        renderRoutes()

        expect(screen.getByText('Sign in from /profile')).toBeTruthy()
      },
    )

    it(
      'renders protected content after the session is restored',
      () => {
        useAuthStore.setState({
          profile: user,
          isLoading: false,
        })

        renderRoutes()

        expect(screen.getByText('Protected page')).toBeTruthy()
      },
    )
  },
)

function renderRoutes() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/profile" element={<p>Protected page</p>} />
        </Route>
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </MemoryRouter>,
  )
}
