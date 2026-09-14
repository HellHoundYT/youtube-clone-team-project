import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useLocation,
  useNavigate,
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

function ChannelAvatar({
  channel,
}: {
  channel: Channel
}) {
  return (
    <div className="channel-page-avatar">
      {channel.avatarUrl
        ? (
            <img
              src={channel.avatarUrl}
              alt=""
            />
          )
        : channel.name.charAt(0).toUpperCase()}
    </div>
  )
}

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

function sortVideos(
  videos: VideoListItem[],
) {
  return [...videos]
    .sort(
      (left, right) =>
        new Date(
          right.publishedAt ?? 0,
        ).getTime() -
        new Date(
          left.publishedAt ?? 0,
        ).getTime(),
    )
    .slice(0, 24)
}

interface SubscriptionsPageProps {
  channelService: ChannelService
  videoService: VideoService
}

function SubscriptionsPage({
  channelService,
  videoService,
}: SubscriptionsPageProps) {
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
  const [channels, setChannels] =
    useState<Channel[]>([])
  const [subscriptions, setSubscriptions] =
    useState<Channel[]>([])
  const [subscriptionVideos, setSubscriptionVideos] =
    useState<VideoListItem[]>([])
  const [ownChannelId, setOwnChannelId] =
    useState<string | null>(null)
  const [isLoading, setIsLoading] =
    useState(true)
  const [busyChannelId, setBusyChannelId] =
    useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)

      try {
        const publicChannels =
          await channelService.listChannels()

        let loadedSubscriptions: Channel[] = []
        let loadedOwnChannel: Channel | null = null
        let loadedVideos: VideoListItem[] = []

        if (profile) {
          const [subscriptionsResult, ownChannelResult] =
            await Promise.all([
              channelService
                .listSubscriptions()
                .catch(() => []),
              channelService
                .getMyChannel()
                .catch(() => null),
            ])

          loadedSubscriptions = subscriptionsResult
          loadedOwnChannel = ownChannelResult

          const videoGroups =
            await Promise.all(
              loadedSubscriptions.map(
                (channel) =>
                  videoService
                    .getVideos({
                      page: 1,
                      pageSize: 12,
                      channelId: channel.id,
                    })
                    .catch(() => []),
              ),
            )

          loadedVideos =
            sortVideos(
              videoGroups.flat(),
            )
        }

        if (cancelled) {
          return
        }

        setChannels(publicChannels)
        setSubscriptions(loadedSubscriptions)
        setSubscriptionVideos(loadedVideos)
        setOwnChannelId(loadedOwnChannel?.id ?? null)
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
    channelService,
    profile,
    videoService,
  ])

  const subscribedIds =
    useMemo(
      () =>
        new Set(
          subscriptions.map(
            (channel) => channel.id,
          ),
        ),
      [subscriptions],
    )

  const subscribedChannels =
    useMemo(
      () =>
        channels
          .filter((channel) => subscribedIds.has(channel.id))
          .map((channel) => ({
            ...channel,
            isSubscribed: true,
          })),
      [
        channels,
        subscribedIds,
      ],
    )

  const discoverChannels =
    useMemo(
      () =>
        channels.filter(
          (channel) =>
            !subscribedIds.has(channel.id) &&
            channel.id !== ownChannelId,
        ),
      [
        channels,
        ownChannelId,
        subscribedIds,
      ],
    )

  const changeSubscription = async (
    channel: Channel,
    shouldSubscribe: boolean,
  ) => {
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

    if (busyChannelId) {
      return
    }

    setBusyChannelId(channel.id)

    try {
      if (shouldSubscribe) {
        await channelService.subscribe(channel.id)
        setSubscriptions((current) => [
          ...current.filter((item) => item.id !== channel.id),
          {
            ...channel,
            isSubscribed: true,
            subscriberCount:
              channel.subscriberCount + 1,
          },
        ])
        setChannels((current) =>
          current.map((item) =>
            item.id === channel.id
              ? {
                  ...item,
                  subscriberCount:
                    item.subscriberCount + 1,
                }
              : item,
          ),
        )

        const videos =
          await videoService
            .getVideos({
              page: 1,
              pageSize: 12,
              channelId: channel.id,
            })
            .catch(() => [])

        setSubscriptionVideos((current) =>
          sortVideos([
            ...current.filter(
              (item) => item.channelId !== channel.id,
            ),
            ...videos,
          ]),
        )
      } else {
        await channelService.unsubscribe(channel.id)
        setSubscriptions((current) =>
          current.filter(
            (item) => item.id !== channel.id,
          ),
        )
        setChannels((current) =>
          current.map((item) =>
            item.id === channel.id
              ? {
                  ...item,
                  subscriberCount:
                    Math.max(
                      0,
                      item.subscriberCount - 1,
                    ),
                }
              : item,
          ),
        )
        setSubscriptionVideos((current) =>
          current.filter(
            (item) => item.channelId !== channel.id,
          ),
        )
      }
    } finally {
      setBusyChannelId(null)
    }
  }

  const locale =
    i18n.resolvedLanguage?.startsWith('uk')
      ? 'uk-UA'
      : 'en-US'

  return (
    <section className="channels-page">
      <div className="channels-heading">
        <div>
          <p className="channel-eyebrow">AMTLIS</p>
          <h1>{t('system.channels.subscriptionsTitle')}</h1>
          <p>{t('system.channels.subscriptionsLead')}</p>
        </div>
        <span className="channel-count">
          {t(
            'system.channels.channelCount',
            {
              count: subscriptions.length,
            },
          )}
        </span>
      </div>

      {isLoading
        ? (
            <div className="channels-loading">
              {t('system.channels.loading')}
            </div>
          )
        : subscribedChannels.length === 0
          ? (
              <div className="channels-empty">
                <h2>{t('system.channels.emptyTitle')}</h2>
                <p>{t('system.channels.emptyLead')}</p>
              </div>
            )
          : (
              <>
                <section className="subscription-feed">
                  <div className="channel-videos-heading">
                    <div>
                      <h2>{t('system.channels.feedTitle')}</h2>
                      <p>{t('system.channels.feedLead')}</p>
                    </div>
                    <span className="channel-count">
                      {t(
                        'system.channels.videoCount',
                        {
                          count: subscriptionVideos.length,
                        },
                      )}
                    </span>
                  </div>

                  {subscriptionVideos.length === 0
                    ? (
                        <div className="channel-videos-empty">
                          <p>{t('system.channels.feedEmpty')}</p>
                        </div>
                      )
                    : (
                        <div className="channel-video-grid">
                          {subscriptionVideos.map((video) => {
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
                                  {video.thumbnailPath
                                    ? (
                                        <img
                                          src={video.thumbnailPath}
                                          alt=""
                                        />
                                      )
                                    : (
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
                                  <span>{video.channelName}</span>
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

                <section className="subscribed-channels-section">
                  <h2>{t('system.channels.followingTitle')}</h2>
                  <div className="channel-grid">
                    {subscribedChannels.map((channel) => (
                      <article
                        className="channel-card"
                        key={channel.id}
                      >
                        <button
                          className="channel-card-main"
                          type="button"
                          onClick={() =>
                            navigate(`/channels/${channel.id}`)}
                        >
                          <ChannelAvatar channel={channel} />
                          <h2>{channel.name}</h2>
                          <p>{channel.description}</p>
                          <span>
                            {channel.subscriberCount}{' '}
                            {t('system.channels.subscribers')}
                          </span>
                        </button>
                        <div className="subscription-card-actions">
                          <span className="subscribe-button is-subscribed">
                            {t('system.channels.subscribed')}
                          </span>
                          <button
                            className="unsubscribe-button"
                            type="button"
                            disabled={busyChannelId === channel.id}
                            onClick={() => {
                              void changeSubscription(
                                channel,
                                false,
                              )
                            }}
                          >
                            {t('system.channels.unsubscribe')}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}

      <section className="channel-discover">
        <h2>{t('system.channels.discoverTitle')}</h2>
        <div className="channel-grid">
          {discoverChannels.map((channel) => (
            <article
              className="channel-card"
              key={channel.id}
            >
              <button
                className="channel-card-main"
                type="button"
                onClick={() =>
                  navigate(`/channels/${channel.id}`)}
              >
                <ChannelAvatar channel={channel} />
                <h2>{channel.name}</h2>
                <p>{channel.description}</p>
                <span>
                  {channel.subscriberCount}{' '}
                  {t('system.channels.subscribers')}
                </span>
              </button>
              <button
                className="subscribe-button"
                type="button"
                disabled={busyChannelId === channel.id}
                onClick={() => {
                  void changeSubscription(
                    channel,
                    true,
                  )
                }}
              >
                {t('system.channels.subscribe')}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default SubscriptionsPage
