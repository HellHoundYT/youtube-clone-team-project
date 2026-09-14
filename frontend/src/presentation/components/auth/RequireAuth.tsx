import {
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'
import {
  useAuthStore,
} from '../../features/auth/authStore'

function RequireAuth() {
  const location =
    useLocation()
  const profile =
    useAuthStore((state) => state.profile)
  const isLoading =
    useAuthStore((state) => state.isLoading)

  if (isLoading) {
    return null
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

  return <Outlet />
}

export default RequireAuth
