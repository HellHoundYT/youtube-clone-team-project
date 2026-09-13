import {
  useEffect,
  useState,
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
  Channel,
} from '../../domain/channel/types'
import {
  useAppTranslation,
} from '../../shared/i18n'
import {
  useAuthStore,
} from '../features/auth/authStore'
import './ChannelsPages.css'

function ChannelPage({
  channelService,
}: {
  channelService: ChannelService
}) {
  const { channelId = '' } =
    useParams()
  const navigate =
    useNavigate()
  const location =
    useLocation()
  const { t } =
    useAppTranslation()
  const profile =
    useAuthStore((state) => state.profile)
  const [channel, setChannel] =
    useState<Channel | null>(null)
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

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setFailed(false)

      try {
        const loadedChannel =
          await channelService.getChannel(channelId)

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

        setChannel(loadedChannel)
        setIsSubscribed(
          subscriptions.some(
            (item) => item.id === loadedChannel.id,
          ),
        )
        setIsOwner(
          ownChannel?.id === loadedChannel.id,
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
          <p className="channel-eyebrow">CHANNEL</p>
          <h1>{channel.name}</h1>
          <p>
            {channel.handle} · {channel.subscriberCount}{' '}
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

      <div className="channel-videos-empty">
        <h2>{t('system.channels.videosTitle')}</h2>
        <p>{t('system.channels.videosLead')}</p>
      </div>
    </section>
  )
}

export default ChannelPage
