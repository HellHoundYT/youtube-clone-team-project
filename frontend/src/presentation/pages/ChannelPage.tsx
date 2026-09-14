import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import type {
  ChannelService,
} from '../../application/channel/service'
import type {
  VideoService,
} from '../../application/video/service'
import type {
  Channel,
} from '../../domain/channel/types'
import type {
  VideoListItem,
} from '../../domain/video/types'
import {
  useAppTranslation,
} from '../../shared/i18n'
import {
  useAuthStore,
} from '../features/auth/authStore'
import './ChannelsPages.css'

function formatDuration(
  seconds: number,
) {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(seconds),
    )
  const minutes =
    Math.floor(
      safeSeconds / 60,
    )
  const remainingSeconds =
    safeSeconds % 60

  return [
    minutes,
    remainingSeconds
      .toString()
      .padStart(2, '0'),
  ].join(':')
}

function ChannelPage({
  channelService,
  videoService,
}: {
  channelService: ChannelService
  videoService: VideoService
}) {
  const { channelId = '' } =
    useParams()
  const navigate =
    useNavigate()
  const location =
    useLocation()
  const {
    t,
    i18n,
  } = useAppTranslation()
  const profile =
    useAuthStore((state) => state.profile)
  const [channel, setChannel] =
    useState<Channel | null>(null)
  const [videos, setVideos] =
    useState<VideoListItem[]>([])
  const [isSubscribed, setIsSubscribed] =
    useState(false)
  const [isOwner, setIsOwner] =
    useState(false)
  const [isLoading, setIsLoading] =
    useState(true)
  const [failed, setFailed] =
    useState(false)
  const [isUpdating, setIsUpdating] =
    useState(false)
  const [ownerName, setOwnerName] =
    useState('')
  const [ownerHandle, setOwnerHandle] =
    useState('')
  const [ownerDescription, setOwnerDescription] =
    useState('')
  const [isSavingOwner, setIsSavingOwner] =
    useState(false)
  const [imageBusy, setImageBusy] =
    useState<'avatar' | 'banner' | null>(null)
  const [ownerSaved, setOwnerSaved] =
    useState(false)
  const [ownerError, setOwnerError] =
    useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setFailed(false)

      try {
        const loadedChannel =
          await channelService.getChannel(channelId)

        const loadedVideos =
          await videoService
            .getVideos({
              page: 1,
              pageSize: 50,
              channelId,
            })
            .catch(() => [])

        let subscriptions: Channel[] = []
        let ownChannel: Channel | null = null

        if (profile) {
          const [loadedSubscriptions, loadedOwnChannel] =
            await Promise.all([
              channelService
                .listSubscriptions()
                .catch(() => []),
              channelService
                .getMyChannel()
                .catch(() => null),
            ])

          subscriptions = loadedSubscriptions
          ownChannel = loadedOwnChannel
        }

        if (cancelled) {
          return
        }

        const ownsChannel =
          ownChannel?.id === loadedChannel.id

        setChannel(loadedChannel)
        setVideos(loadedVideos)
        setIsSubscribed(
          subscriptions.some(
            (item) => item.id === loadedChannel.id,
          ),
        )
        setIsOwner(ownsChannel)
        setOwnerName(
          ownsChannel && ownChannel
            ? ownChannel.name
            : loadedChannel.name,
        )
        setOwnerHandle(
          ownsChannel && ownChannel
            ? ownChannel.handle
            : loadedChannel.handle,
        )
        setOwnerDescription(
          ownsChannel && ownChannel
            ? ownChannel.description
            : loadedChannel.description,
        )
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [
    channelId,
    channelService,
    profile,
    videoService,
  ])

  const toggleSubscription = async () => {
    if (!channel || isUpdating || isOwner) {
      return
    }

    if (!profile) {
      navigate(
        '/auth',
        {
          state: {
            from: location.pathname,
          },
        },
      )
      return
    }

    setIsUpdating(true)

    try {
      if (isSubscribed) {
        await channelService.unsubscribe(channel.id)
        setIsSubscribed(false)
        setChannel((current) =>
          current
            ? {
                ...current,
                subscriberCount:
                  Math.max(
                    0,
                    current.subscriberCount - 1,
                  ),
              }
            : current,
        )
      } else {
        await channelService.subscribe(channel.id)
        setIsSubscribed(true)
        setChannel((current) =>
          current
            ? {
                ...current,
                subscriberCount:
                  current.subscriberCount + 1,
              }
            : current,
        )
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const saveOwnerChannel = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!channel || !isOwner || isSavingOwner) {
      return
    }

    setIsSavingOwner(true)
    setOwnerSaved(false)
    setOwnerError(false)

    try {
      const updated =
        await channelService.updateChannel(
          channel.id,
          {
            name: ownerName,
            handle: ownerHandle,
            description: ownerDescription,
          },
        )

      setChannel(updated)
      setOwnerName(updated.name)
      setOwnerHandle(updated.handle)
      setOwnerDescription(updated.description)
      setOwnerSaved(true)
    } catch {
      setOwnerError(true)
    } finally {
      setIsSavingOwner(false)
    }
  }

  const uploadOwnerImage = async (
    kind: 'avatar' | 'banner',
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    event.target.value = ''

    if (!file || !channel || !isOwner || imageBusy) {
      return
    }

    const allowedTypes =
      new Set([
        'image/png',
        'image/jpeg',
        'image/webp',
      ])
    const maxSize =
      kind === 'avatar'
        ? 5 * 1024 * 1024
        : 10 * 1024 * 1024

    setOwnerSaved(false)
    setOwnerError(false)

    if (!allowedTypes.has(file.type) || file.size > maxSize) {
      setOwnerError(true)
      return
    }

    setImageBusy(kind)

    try {
      const updated =
        kind === 'avatar'
          ? await channelService.uploadAvatar(
              channel.id,
              file,
            )
          : await channelService.uploadBanner(
              channel.id,
              file,
            )
      const cacheToken =
        Date.now()

      setChannel({
        ...updated,
        avatarUrl:
          updated.avatarUrl
            ? `${updated.avatarUrl}?v=${cacheToken}`
            : null,
        bannerUrl:
          updated.bannerUrl
            ? `${updated.bannerUrl}?v=${cacheToken}`
            : null,
      })
      setOwnerSaved(true)
    } catch {
      setOwnerError(true)
    } finally {
      setImageBusy(null)
    }
  }

  if (isLoading) {
    return (
      <section className="channels-page">
        <div className="channels-loading">
          {t('system.channels.loading')}
        </div>
      </section>
    )
  }

  if (failed || !channel) {
    return (
      <section className="channels-page">
        <div className="channels-empty">
          {t('system.channels.unavailable')}
        </div>
      </section>
    )
  }

  const locale =
    i18n.resolvedLanguage?.startsWith('uk')
      ? 'uk-UA'
      : 'en-US'

  return (
    <section className="channels-page">
      <Link
        className="channel-back"
        to="/subscriptions"
      >
        ← {t('system.channels.back')}
      </Link>

      {channel.bannerUrl && (
        <img
          className="channel-banner"
          src={channel.bannerUrl}
          alt=""
        />
      )}

      <div className="channel-profile-hero">
        <div className="channel-page-avatar channel-page-avatar-large">
          {channel.avatarUrl
            ? (
                <img
                  src={channel.avatarUrl}
                  alt=""
                />
              )
            : channel.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="channel-eyebrow">AMTLIS CHANNEL</p>
          <h1>{channel.name}</h1>
          <p>
            @{channel.handle} · {channel.subscriberCount}{' '}
            {t('system.channels.subscribers')}
          </p>
          <p className="channel-description">
            {channel.description}
          </p>
        </div>

        {!isOwner && (
          <button
            className={`subscribe-button ${
              isSubscribed
                ? 'is-subscribed'
                : ''
            }`}
            type="button"
            disabled={isUpdating}
            onClick={() => {
              void toggleSubscription()
            }}
          >
            {isSubscribed
              ? t('system.channels.subscribed')
              : t('system.channels.subscribe')}
          </button>
        )}
      </div>

      {isOwner && (
        <section className="channel-owner-panel">
          <div className="channel-owner-heading">
            <div>
              <p className="channel-eyebrow">
                {t('system.channels.ownerEyebrow')}
              </p>
              <h2>{t('system.channels.ownerTitle')}</h2>
              <p>{t('system.channels.ownerLead')}</p>
            </div>
            {ownerSaved && (
              <span className="channel-owner-status is-success">
                {t('system.channels.saved')}
              </span>
            )}
            {ownerError && (
              <span className="channel-owner-status is-error">
                {t('system.channels.saveFailed')}
              </span>
            )}
          </div>

          <form
            className="channel-owner-form"
            onSubmit={(event) => {
              void saveOwnerChannel(event)
            }}
          >
            <label>
              <span>{t('system.channels.nameLabel')}</span>
              <input
                type="text"
                value={ownerName}
                maxLength={100}
                required
                onChange={(event) =>
                  setOwnerName(event.target.value)}
              />
            </label>

            <label>
              <span>{t('system.channels.handleLabel')}</span>
              <input
                type="text"
                value={ownerHandle}
                maxLength={64}
                required
                onChange={(event) =>
                  setOwnerHandle(event.target.value)}
              />
            </label>

            <label className="channel-owner-description">
              <span>{t('system.channels.descriptionLabel')}</span>
              <textarea
                value={ownerDescription}
                maxLength={1000}
                rows={4}
                onChange={(event) =>
                  setOwnerDescription(event.target.value)}
              />
            </label>

            <button
              className="channel-owner-save"
              type="submit"
              disabled={isSavingOwner}
            >
              {isSavingOwner
                ? t('system.channels.saving')
                : t('system.channels.save')}
            </button>
          </form>

          <div className="channel-owner-media-grid">
            <label className="channel-owner-upload">
              <strong>{t('system.channels.avatarTitle')}</strong>
              <span>{t('system.channels.avatarHint')}</span>
              <span className="channel-owner-upload-action">
                {imageBusy === 'avatar'
                  ? t('system.channels.uploading')
                  : t('system.channels.chooseAvatar')}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={imageBusy !== null}
                onChange={(event) => {
                  void uploadOwnerImage(
                    'avatar',
                    event,
                  )
                }}
              />
            </label>

            <label className="channel-owner-upload">
              <strong>{t('system.channels.bannerTitle')}</strong>
              <span>{t('system.channels.bannerHint')}</span>
              <span className="channel-owner-upload-action">
                {imageBusy === 'banner'
                  ? t('system.channels.uploading')
                  : t('system.channels.chooseBanner')}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={imageBusy !== null}
                onChange={(event) => {
                  void uploadOwnerImage(
                    'banner',
                    event,
                  )
                }}
              />
            </label>
          </div>
        </section>
      )}

      <section className="channel-videos-section">
        <div className="channel-videos-heading">
          <div>
            <h2>{t('system.channels.videosTitle')}</h2>
            <p>{t('system.channels.videosLead')}</p>
          </div>
          <span className="channel-count">
            {t(
              'system.channels.videoCount',
              {
                count: videos.length,
              },
            )}
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="channel-videos-empty">
            <p>{t('system.channels.noVideos')}</p>
          </div>
        ) : (
          <div className="channel-video-grid">
            {videos.map((video) => {
              const formattedViews =
                new Intl.NumberFormat(
                  locale,
                  {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  },
                ).format(video.viewCount)

              return (
                <button
                  className="channel-video-card"
                  key={video.id}
                  type="button"
                  onClick={() =>
                    navigate(`/watch/${video.id}`)}
                >
                  <div className="channel-video-thumbnail">
                    {video.thumbnailPath ? (
                      <img
                        src={video.thumbnailPath}
                        alt=""
                      />
                    ) : (
                      <span>A</span>
                    )}
                    <small>
                      {formatDuration(
                        video.durationSeconds,
                      )}
                    </small>
                  </div>
                  <div className="channel-video-copy">
                    <strong>{video.title}</strong>
                    <span>
                      {t(
                        'home.views',
                        {
                          count: video.viewCount,
                          formatted: formattedViews,
                        },
                      )}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}

export default ChannelPage
