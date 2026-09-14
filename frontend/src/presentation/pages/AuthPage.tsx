import {
  type FormEvent,
  useState,
} from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  useAuthStore,
} from '../features/auth/authStore'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './AuthProfilePage.css'

type AuthMode =
  | 'sign-in'
  | 'register'

function AuthPage() {
  const navigate =
    useNavigate()
  const location =
    useLocation()
  const {
    t,
  } = useAppTranslation()
  const register =
    useAuthStore((state) => state.register)
  const signIn =
    useAuthStore((state) => state.signIn)
  const [mode, setMode] =
    useState<AuthMode>('sign-in')
  const [email, setEmail] =
    useState('')
  const [password, setPassword] =
    useState('')
  const [displayName, setDisplayName] =
    useState('')
  const [error, setError] =
    useState('')
  const [isSubmitting, setIsSubmitting] =
    useState(false)
  const returnPath =
    (location.state as {
      from?: string
    } | null)?.from ?? '/profile'

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setError('')

    if (!email.includes('@')) {
      setError(t('system.auth.invalidEmail'))
      return
    }

    if (password.length < 6) {
      setError(t('system.auth.invalidPassword'))
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'register') {
        const name = displayName.trim()

        if (!name) {
          setError(t('system.auth.missingName'))
          return
        }

        await register({
          email: email.trim().toLowerCase(),
          password,
          displayName: name,
        })
      } else {
        await signIn(
          email.trim().toLowerCase(),
          password,
        )
      }

      navigate(returnPath, {
        replace: true,
      })
    } catch {
      setError(t('system.auth.requestFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const changeMode = (
    nextMode: AuthMode,
  ) => {
    setMode(nextMode)
    setError('')
  }

  return (
    <section className="account-page auth-page">
      <div className="auth-card">
        <p className="account-eyebrow">
          {t('system.auth.eyebrow')}
        </p>

        <h1>
          {mode === 'sign-in'
            ? t('system.auth.welcome')
            : t('system.auth.create')}
        </h1>

        <p className="account-lead">
          {mode === 'sign-in'
            ? t('system.auth.signInLead')
            : t('system.auth.registerLead')}
        </p>

        <div className="auth-tabs">
          <button
            className={mode === 'sign-in' ? 'is-active' : ''}
            type="button"
            onClick={() => changeMode('sign-in')}
            disabled={isSubmitting}
          >
            {t('system.auth.signIn')}
          </button>

          <button
            className={mode === 'register' ? 'is-active' : ''}
            type="button"
            onClick={() => changeMode('register')}
            disabled={isSubmitting}
          >
            {t('system.auth.register')}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="account-form"
          aria-busy={isSubmitting}
        >
          {mode === 'register' && (
            <label>
              {t('system.auth.displayName')}
              <input
                value={displayName}
                maxLength={40}
                autoComplete="name"
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
          )}

          <label>
            {t('system.auth.email')}
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label>
            {t('system.auth.password')}
            <input
              type="password"
              value={password}
              minLength={6}
              autoComplete={
                mode === 'sign-in'
                  ? 'current-password'
                  : 'new-password'
              }
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="account-primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t('system.auth.loading')
              : mode === 'sign-in'
                ? t('system.auth.signIn')
                : t('system.auth.createAccount')}
          </button>
        </form>

        <p className="account-note">
          {t('system.auth.localSession')}
        </p>

        <Link to="/" className="account-back-link">
          {t('system.auth.backHome')}
        </Link>
      </div>
    </section>
  )
}

export default AuthPage
