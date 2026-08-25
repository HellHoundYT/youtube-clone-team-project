import {
  type FormEvent,
  useState,
} from 'react'
import {
  Link,
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

type SocialProvider =
  | 'Facebook'
  | 'Google'
  | 'X'
  | 'Apple'

function AuthPage() {
  const navigate =
    useNavigate()
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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!email.includes('@')) {
      setError(t('system.auth.invalidEmail'))
      return
    }

    if (password.length < 6) {
      setError(t('system.auth.invalidPassword'))
      return
    }

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

    navigate('/profile')
  }

  const changeMode = (
    nextMode: AuthMode,
  ) => {
    setMode(nextMode)
    setError('')
  }

  const handleSocialAuth = async (
    provider: SocialProvider,
  ) => {
    const providerKey = provider
      .toLowerCase()
      .replace(/[^a-z]/g, '')

    await register({
      displayName: provider,
      email: `${providerKey}-user@amtlis.local`,
      password: 'local-oauth',
    })
    navigate('/profile')
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
          >
            {t('system.auth.signIn')}
          </button>

          <button
            className={mode === 'register' ? 'is-active' : ''}
            type="button"
            onClick={() => changeMode('register')}
          >
            {t('system.auth.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="account-form">
          {mode === 'register' && (
            <label>
              {t('system.auth.displayName')}
              <input
                value={displayName}
                maxLength={40}
                autoComplete="name"
                onChange={(event) => setDisplayName(event.target.value)}
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
            />
          </label>

          <label>
            {t('system.auth.password')}
            <input
              type="password"
              value={password}
              minLength={6}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && (
            <p className="account-error" role="alert">
              {error}
            </p>
          )}

          <button className="account-primary" type="submit">
            {mode === 'sign-in'
              ? t('system.auth.signIn')
              : t('system.auth.createAccount')}
          </button>
        </form>

        <div className="social-auth">
          <div className="social-auth-divider">
            <span>{t('system.auth.orContinue')}</span>
          </div>
          <div className="social-auth-buttons">
            <button className="social-auth-button facebook" type="button" aria-label={t('system.auth.continueFacebook')} onClick={() => { void handleSocialAuth('Facebook') }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.75l.41-3.19H13.5V8.77c0-.92.26-1.55 1.58-1.55h1.69V4.37c-.29-.04-1.29-.13-2.46-.13-2.44 0-4.11 1.49-4.11 4.23v2.34H7.44V14h2.76v8h3.3Z" /></svg></button>
            <button className="social-auth-button google" type="button" aria-label={t('system.auth.continueGoogle')} onClick={() => { void handleSocialAuth('Google') }}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.31 2.98-7.36Z" /><path fill="#34a853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.51c-.9.6-2.05.95-3.39.95-2.61 0-4.82-1.76-5.61-4.13H6.06v2.59A10 10 0 0 0 12 22Z" /><path fill="#fbbc05" d="M6.39 13.88A6 6 0 0 1 6.08 12c0-.65.11-1.27.31-1.88V7.53H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.47l3.33-2.59Z" /><path fill="#ea4335" d="M12 5.99c1.46 0 2.77.5 3.8 1.49l2.85-2.85C16.96 3.05 14.7 2 12 2a10 10 0 0 0-8.94 5.53l3.33 2.59C7.18 7.75 9.39 5.99 12 5.99Z" /></svg></button>
            <button className="social-auth-button x" type="button" aria-label={t('system.auth.continueX')} onClick={() => { void handleSocialAuth('X') }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.51 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" /></svg></button>
            <button className="social-auth-button apple" type="button" aria-label={t('system.auth.continueApple')} onClick={() => { void handleSocialAuth('Apple') }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.58 9.05 7.3c1.35.07 2.3.74 3.1.8 1.19-.24 2.33-.93 3.59-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.58 4.1ZM12.05 7.25C11.9 5.02 13.71 3.18 15.78 3c.29 2.58-2.34 4.5-3.73 4.25Z" /></svg></button>
          </div>
        </div>

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
