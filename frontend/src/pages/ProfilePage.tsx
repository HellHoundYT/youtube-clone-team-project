import {
  type FormEvent,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import {
  type AccountProfile,
  useAuthStore,
} from '../features/auth/authStore'
import {
  useAppTranslation,
} from '../i18n'
import './AuthProfilePage.css'

function ProfilePage() {
  const navigate =
    useNavigate()
  const {
    t,
  } = useAppTranslation()
  const profile =
    useAuthStore((state) => state.profile)
  const updateProfile =
    useAuthStore((state) => state.updateProfile)
  const signOut =
    useAuthStore((state) => state.signOut)
  const [form, setForm] =
    useState<AccountProfile | null>(profile)
  const [saved, setSaved] =
    useState(false)
  const [saveError, setSaveError] =
    useState('')

  if (!profile || !form) {
    return (
      <section className="account-page profile-empty">
        <div className="auth-card">
          <p className="account-eyebrow">{t('system.profile.emptyEyebrow')}</p>
          <h1>{t('system.profile.emptyTitle')}</h1>
          <p className="account-lead">
            {t('system.profile.emptyLead')}
          </p>
          <Link className="account-primary account-link-button" to="/auth">
            {t('system.profile.signIn')}
          </Link>
        </div>
      </section>
    )
  }

  const initials =
    profile.displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const updateField = <Key extends keyof AccountProfile>(
    key: Key,
    value: AccountProfile[Key],
  ) => {
    setForm((current) => current ? {
      ...current,
      [key]: value,
    } : current)
    setSaved(false)
    setSaveError('')
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    const updatedProfile = {
      ...form,
      displayName: form.displayName.trim(),
      handle: form.handle.trim().startsWith('@')
        ? form.handle.trim()
        : `@${form.handle.trim()}`,
    }

    try {
      await updateProfile(updatedProfile)
      setForm(updatedProfile)
      setSaved(true)
    } catch {
      setSaveError(
        t('system.profile.saveError'),
      )
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <section className="account-page profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div>
          <p className="account-eyebrow">{t('system.profile.eyebrow')}</p>
          <h1>{profile.displayName}</h1>
          <p>{profile.handle}</p>
        </div>
      </div>

      <div className="profile-grid">
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-heading">
            <div>
              <h2>{t('system.profile.detailsTitle')}</h2>
              <p>{t('system.profile.detailsLead')}</p>
            </div>
            {saved && <span className="save-confirmation">{t('system.profile.saved')}</span>}
          </div>

          <label>
            {t('system.profile.displayName')}
            <input value={form.displayName} maxLength={40} onChange={(event) => updateField('displayName', event.target.value)} />
          </label>
          <label>
            {t('system.profile.handle')}
            <input value={form.handle} maxLength={40} onChange={(event) => updateField('handle', event.target.value)} />
          </label>
          <label>
            {t('system.profile.email')}
            <input value={form.email} type="email" onChange={(event) => updateField('email', event.target.value)} />
          </label>
          <label>
            {t('system.profile.about')}
            <textarea value={form.bio} maxLength={240} rows={4} placeholder={t('system.profile.aboutPlaceholder')} onChange={(event) => updateField('bio', event.target.value)} />
          </label>

          {saveError && (
            <p className="account-error" role="alert">
              {saveError}
            </p>
          )}

          <button className="account-primary" type="submit">{t('system.profile.saveChanges')}</button>
        </form>

        <aside className="profile-side-card">
          <h2>{t('system.profile.account')}</h2>
          <dl>
            <div><dt>{t('system.profile.status')}</dt><dd>{t('system.profile.active')}</dd></div>
            <div><dt>{t('system.profile.channel')}</dt><dd>{t('system.profile.comingNext')}</dd></div>
            <div><dt>{t('system.profile.subscriptions')}</dt><dd>{t('system.profile.comingNext')}</dd></div>
          </dl>
          <button className="account-secondary" type="button" onClick={() => { void handleSignOut() }}>
            {t('system.profile.signOut')}
          </button>
        </aside>
      </div>
    </section>
  )
}

export default ProfilePage
