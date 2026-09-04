import type {
  ReactNode,
} from 'react'
import {
  Navigate,
  useLocation,
} from 'react-router-dom'
import {
  useAuthStore,
} from '../../features/auth/authStore'

interface ProtectedRouteProps {
  children: ReactNode
}

function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const location =
    useLocation()
  const profile =
    useAuthStore((state) => state.profile)
  const isInitialized =
    useAuthStore((state) => state.isInitialized)

  if (!isInitialized) {
    return (
      <section className="account-page profile-empty">
        <div className="auth-card" aria-live="polite">
          Restoring your session…
        </div>
      </section>
    )
  }

  if (!profile) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return children
}

export default ProtectedRoute
