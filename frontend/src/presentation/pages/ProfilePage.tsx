import {
  type ChangeEvent,
  type FormEvent,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import type {
  ChannelService,
} from '../../application/channel/service'
import {
  type AccountProfile,
  useAuthStore,
} from '../features/auth/authStore'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './AuthProfilePage.css'

const maxAvatarSize =
  5 * 1024 * 1024

const allowedAvatarTypes =
  new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
  ])

interface ProfilePageProps {
  channelService: ChannelService
}

function ProfilePage({
  channelService,
}: ProfilePageProps) {
  const navigate =
    useNavigate()
  const {
    t,
  } = useAppTranslation()
  const profile =
    useAuthStore((state) => state.profile)
  const updateProfile =
    useAuthStore((state) => state.updateProfile)
  const uploadAvatar =
    useAuthStore((state) => state.uploadAvatar)
  const signOut =
    useAuthStore((state) => state.signOut)
  const [form, setForm] =
    useState<AccountProfile | null>(profile)
  const [saved, setSaved] =
    useState(false)
  const [saveError, setSaveError] =
    useState('')
  const [avatarError, setAvatarError] =
    useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] =
    useState(false)
  const [isOpeningChannel, setIsOpeningChannel] =
    useState(false)

  if (!profile || !form) {
    return null
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

    const displayName =
      form.displayName.trim()
    const handle =
      form.handle.trim().startsWith('@')
        ? form.handle.trim()
        : `@${form.handle.trim()}`

    try {
      await updateProfile({
        displayName,
        handle,
        email: form.email.trim().toLowerCase(),
        bio: form.bio.trim(),
        themeId: form.themeId,
      })

      const latestProfile =
        useAuthStore.getState().profile

      if (latestProfile) {
        setForm(latestProfile)
      }

      setSaved(true)
    } catch {
      setSaveError(
        t('system.profile.saveError'),
      )
    }
  }

  const handleAvatarChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!allowedAvatarTypes.has(file.type)) {
      setAvatarError(
        t('system.profile.avatarTypeError'),
      )
      return
    }

    if (file.size > maxAvatarSize) {
      setAvatarError(
        t('system.profile.avatarSizeError'),
      )
      return
    }

    setAvatarError('')
    setIsUploadingAvatar(true)

    try {
      await uploadAvatar(file)

      const latestProfile =
        useAuthStore.getState().profile

      if (latestProfile) {
        setForm(latestProfile)
      }
    } catch {
      setAvatarError(
        t('system.profile.avatarUploadError'),
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleOpenChannel = async () => {
    if (isOpeningChannel) {
      return
    }

    setIsOpeningChannel(true)
    setSaveError('')

    try {
      const channel =
        await channelService.getMyChannel()

      navigate(`/channels/${channel.id}`)
    } catch {
      setSaveError(
        t('system.profile.saveError'),
      )
    } finally {
      setIsOpeningChannel(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <section className="account-page profile-page">
      <div className="profile-hero">
        <div className="profile-avatar">
          {profile.avatarUrl
            ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                />
              )
            : initials}
        </div>
        <div>
          <p className="account-eyebrow">
            {t('system.profile.eyebrow')}
          </p>
          <h1>{profile.displayName}</h1>
          <p>{profile.handle}</p>
        </div>
      </div>

      <div className="profile-grid">
        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >
          <div className="profile-form-heading">
            <div>
              <h2>{t('system.profile.detailsTitle')}</h2>
              <p>{t('system.profile.detailsLead')}</p>
            </div>
            {saved && (
              <span className="save-confirmation">
                {t('system.profile.saved')}
              </span>
            )}
          </div>

          <div className="profile-avatar-editor">
            <div className="profile-avatar profile-avatar-small">
              {profile.avatarUrl
                ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                    />
                  )
                : initials}
            </div>
            <div className="profile-avatar-actions">
              <strong>{t('system.profile.avatar')}</strong>
              <span>{t('system.profile.avatarHint')}</span>
              <label className="account-secondary profile-avatar-button">
                {isUploadingAvatar
                  ? t('system.profile.avatarUploading')
                  : t('system.profile.avatarUpload')}
                <input
                  className="profile-avatar-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isUploadingAvatar}
                  onChange={(event) => {
                    void handleAvatarChange(event)
                  }}
                />
              </label>
            </div>
          </div>

          {avatarError && (
            <p className="account-error" role="alert">
              {avatarError}
            </p>
          )}

          <label>
            {t('system.profile.displayName')}
            <input
              value={form.displayName}
              maxLength={40}
              onChange={(event) =>
                updateField(
                  'displayName',
                  event.target.value,
                )}
            />
          </label>
          <label>
            {t('system.profile.handle')}
            <input
              value={form.handle}
              maxLength={40}
              onChange={(event) =>
                updateField(
                  'handle',
                  event.target.value,
                )}
            />
          </label>
          <label>
            {t('system.profile.email')}
            <input
              value={form.email}
              type="email"
              onChange={(event) =>
                updateField(
                  'email',
                  event.target.value,
                )}
            />
          </label>
          <label>
            {t('system.profile.about')}
            <textarea
              value={form.bio}
              maxLength={240}
              rows={4}
              placeholder={t('system.profile.aboutPlaceholder')}
              onChange={(event) =>
                updateField(
                  'bio',
                  event.target.value,
                )}
            />
          </label>

          {saveError && (
            <p className="account-error" role="alert">
              {saveError}
            </p>
          )}

          <button
            className="account-primary"
            type="submit"
          >
            {t('system.profile.saveChanges')}
          </button>
        </form>

        <aside className="profile-side-card">
          <h2>{t('system.profile.account')}</h2>
          <dl>
            <div>
              <dt>{t('system.profile.status')}</dt>
              <dd>{t('system.profile.active')}</dd>
            </div>
            <div>
              <dt>{t('system.profile.channel')}</dt>
              <dd>
                <button
                  className="account-secondary"
                  type="button"
                  disabled={isOpeningChannel}
                  onClick={() => {
                    void handleOpenChannel()
                  }}
                >
                  {t('system.channels.ownerTitle')}
                </button>
              </dd>
            </div>
            <div>
              <dt>{t('system.profile.subscriptions')}</dt>
              <dd>
                <button
                  className="account-secondary"
                  type="button"
                  onClick={() => navigate('/subscriptions')}
                >
                  {t('system.channels.subscriptionsTitle')}
                </button>
              </dd>
            </div>
          </dl>
          <button
            className="account-secondary"
            type="button"
            onClick={() => {
              void handleSignOut()
            }}
          >
            {t('system.profile.signOut')}
          </button>
        </aside>
      </div>
    </section>
  )
}

export default ProfilePage
