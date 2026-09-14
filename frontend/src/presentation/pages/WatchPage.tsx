import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import type {
  ChannelService,
} from '../../application/channel/service'
import type {
  LibraryService,
} from '../../application/library/service'
import type {
  PlaylistService,
} from '../../application/playlist/service'
import type {
  VideoService,
} from '../../application/video/service'
import type {
  VideoDetails,
  VideoListItem,
} from '../../domain/video/types'
import CommentsSection from '../components/comments/CommentsSection'
import AddToPlaylistButton from '../components/playlists/AddToPlaylistButton'
import VideoPlayer from '../components/video/VideoPlayer'
import {
  useAuthStore,
} from '../features/auth/authStore'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './WatchPage.css'

interface WatchLoadState {
  videoId: string
  video: VideoDetails | null
  recommendations: VideoListItem[]
  initialProgressSeconds: number
  error: boolean
}

const categoryKeys: Record<string, string> = {
  Music: 'common.category.music',
  Games: 'common.category.games',
  Cybersport: 'common.category.cybersport',
  Education: 'common.category.education',
  Films: 'common.category.films',
  Podcasts: 'common.category.podcasts',
  Mixes: 'common.category.mixes',
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) {
    return [
      hours,
      minutes.toString().padStart(2, '0'),
      remainingSeconds.toString().padStart(2, '0'),
    ].join(':')
  }

  return [
    minutes,
    remainingSeconds.toString().padStart(2, '0'),
  ].join(':')
}

function getLocale(language: string | undefined) {
  return language?.toLowerCase().startsWith('uk')
    ? 'uk-UA'
    : 'en-US'
}

function formatViews(viewCount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(viewCount)
}

function formatPublishedDate(
  value: string | null,
  locale: string,
  fallback: string,
) {
  if (!value) {
    return fallback
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

interface WatchPageProps {
  channelService: ChannelService
  libraryService: LibraryService
  playlistService: PlaylistService
  videoService: VideoService
}

function WatchPage({
  channelService,
  libraryService,
  playlistService,
  videoService,
}: WatchPageProps) {
  const { videoId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useAppTranslation()
  const locale = getLocale(i18n.resolvedLanguage)
  const profile =
    useAuthStore((state) => state.profile)
  const [loadState, setLoadState] = useState<WatchLoadState | null>(null)
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isOwnChannel, setIsOwnChannel] = useState(false)
  const [isSubscriptionBusy, setIsSubscriptionBusy] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isFavoriteBusy, setIsFavoriteBusy] = useState(false)

  useEffect(() => {
    if (!videoId) {
      return
    }

    const controller = new AbortController()

    const loadWatchPage = async () => {
      try {
        const video = await videoService.getVideoById(
          videoId,
          controller.signal,
        )

        let recommendations: VideoListItem[] = []
        let initialProgressSeconds = 0
        let loadedSubscriberCount = 0
        let loadedIsSubscribed = false
        let loadedIsOwnChannel = false
        let loadedIsFavorite = false

        try {
          recommendations = await videoService.getVideoRecommendations(
            video,
            controller.signal,
          )
        } catch {
          if (controller.signal.aborted) {
            return
          }
        }

        try {
          const history = await libraryService.getWatchHistory(
            controller.signal,
          )
          const historyItem = history.find(
            (item) => item.videoId === video.id,
          )

          if (historyItem && !historyItem.completed) {
            initialProgressSeconds = historyItem.progressSeconds
          }
        } catch {
          if (controller.signal.aborted) {
            return
          }
        }

        try {
          const channel = await channelService.getChannel(
            video.channelId,
          )

          loadedSubscriberCount = channel.subscriberCount
        } catch {
          if (controller.signal.aborted) {
            return
          }
        }

        if (profile) {
          try {
            const [subscriptions, ownChannel, favorites] =
              await Promise.all([
                channelService.listSubscriptions(),
                channelService.getMyChannel().catch(() => null),
                libraryService.getFavorites(controller.signal),
              ])

            loadedIsSubscribed = subscriptions.some(
              (channel) => channel.id === video.channelId,
            )
            loadedIsOwnChannel = ownChannel?.id === video.channelId
            loadedIsFavorite = favorites.some(
              (favorite) => favorite.videoId === video.id,
            )
          } catch {
            if (controller.signal.aborted) {
              return
            }
          }
        }

        if (controller.signal.aborted) {
          return
        }

        setSubscriberCount(loadedSubscriberCount)
        setIsSubscribed(loadedIsSubscribed)
        setIsOwnChannel(loadedIsOwnChannel)
        setIsFavorite(loadedIsFavorite)
        setLoadState({
          videoId,
          video,
          recommendations,
          initialProgressSeconds,
          error: false,
        })
      } catch {
        if (!controller.signal.aborted) {
          setLoadState({
            videoId,
            video: null,
            recommendations: [],
            initialProgressSeconds: 0,
            error: true,
          })
        }
      }
    }

    void loadWatchPage()
    return () => controller.abort()
  }, [
    channelService,
    libraryService,
    profile,
    videoId,
    videoService,
  ])

  if (!videoId) {
    return (
      <section className="watch-page">
        <div className="watch-state watch-error-state">
          <span className="watch-state-code">400</span>
          <h1>{t('watch.unavailable')}</h1>
          <p>{t('watch.missingId')}</p>
          <Link className="watch-back-link" to="/">
            {t('watch.backHome')}
          </Link>
        </div>
      </section>
    )
  }

  const isLoading = loadState?.videoId !== videoId

  if (isLoading) {
    return (
      <section className="watch-page">
        <div className="watch-state">
          <div className="watch-loading-spinner" />
          <p>{t('watch.loading')}</p>
        </div>
      </section>
    )
  }

  if (loadState.error || !loadState.video) {
    return (
      <section className="watch-page">
        <div className="watch-state watch-error-state">
          <span className="watch-state-code">404</span>
          <h1>{t('watch.unavailable')}</h1>
          <p>
            {loadState.error
              ? t('watch.loadError')
              : t('watch.notFound')}
          </p>
          <Link className="watch-back-link" to="/">
            {t('watch.backHome')}
          </Link>
        </div>
      </section>
    )
  }

  const video = loadState.video
  const formattedViews = formatViews(video.viewCount, locale)
  const categoryLabel = video.category
    ? t(
        categoryKeys[video.category] ?? video.category,
        { defaultValue: video.category },
      )
    : null
  const visibilityLabel = t(
    `common.visibility.${video.visibility.toLowerCase()}`,
    { defaultValue: video.visibility },
  )

  const requireAuthentication = () => {
    if (profile) {
      return true
    }

    navigate(
      '/auth',
      {
        state: {
          from: `/watch/${video.id}`,
        },
      },
    )

    return false
  }

  const toggleFavorite = async () => {
    if (isFavoriteBusy || !requireAuthentication()) {
      return
    }

    setIsFavoriteBusy(true)

    try {
      if (isFavorite) {
        await libraryService.removeFavorite(video.id)
        setIsFavorite(false)
      } else {
        await libraryService.addFavorite(video.id)
        setIsFavorite(true)
      }
    } finally {
      setIsFavoriteBusy(false)
    }
  }

  const toggleSubscription = async () => {
    if (
      isSubscriptionBusy ||
      isOwnChannel ||
      !requireAuthentication()
    ) {
      return
    }

    setIsSubscriptionBusy(true)

    try {
      if (isSubscribed) {
        await channelService.unsubscribe(video.channelId)
        setIsSubscribed(false)
        setSubscriberCount((current) => Math.max(0, current - 1))
      } else {
        await channelService.subscribe(video.channelId)
        setIsSubscribed(true)
        setSubscriberCount((current) => current + 1)
      }
    } finally {
      setIsSubscriptionBusy(false)
    }
  }

  const handleFirstPlay = async (currentTime: number) => {
    try {
      await videoService.registerVideoView(video.id)
      setLoadState((current) => {
        if (
          !current ||
          current.videoId !== video.id ||
          !current.video
        ) {
          return current
        }

        return {
          ...current,
          video: {
            ...current.video,
            viewCount: current.video.viewCount + 1,
          },
        }
      })
    } catch {
      // Playback must not be interrupted by a view counter failure.
    }

    try {
      await libraryService.updateWatchHistory(
        video.id,
        {
          progressSeconds: Math.max(0, Math.floor(currentTime)),
          completed: false,
        },
      )
    } catch {
      // History errors must not interrupt playback.
    }
  }

  const handleProgress = async (
    currentTime: number,
    duration: number,
    completed: boolean,
  ) => {
    try {
      await libraryService.updateWatchHistory(
        video.id,
        {
          progressSeconds: completed ? duration : currentTime,
          completed,
        },
      )
    } catch {
      // History errors must not interrupt playback.
    }
  }

  return (
    <section className="watch-page">
      <div className="watch-main-column">
        <VideoPlayer
          src={video.videoPath}
          title={video.title}
          poster={video.thumbnailPath}
          initialTime={loadState.initialProgressSeconds}
          onFirstPlay={(currentTime) => {
            void handleFirstPlay(currentTime)
          }}
          onProgress={(currentTime, duration, completed) => {
            void handleProgress(currentTime, duration, completed)
          }}
        />

        <div className="watch-video-info">
          <div className="watch-video-heading">
            <div>
              {categoryLabel && (
                <span className="watch-category">
                  {categoryLabel}
                </span>
              )}
              <h1>{video.title}</h1>
            </div>
            <span className="watch-visibility">
              {visibilityLabel}
            </span>
          </div>

          <div className="watch-video-meta">
            <span>
              {t('watch.views', {
                count: video.viewCount,
                formatted: formattedViews,
              })}
            </span>
            <span className="watch-meta-dot" />
            <span>
              {formatPublishedDate(
                video.publishedAt,
                locale,
                t('watch.notPublished'),
              )}
            </span>
          </div>

          <div className="watch-party-action-row">
            <button
              type="button"
              className="watch-start-party-button"
              disabled={isFavoriteBusy}
              onClick={() => {
                void toggleFavorite()
              }}
            >
              {isFavorite
                ? `✓ ${t('layout.navigation.favorites')}`
                : `+ ${t('layout.navigation.favorites')}`}
            </button>
            <button
              type="button"
              className="watch-start-party-button"
              onClick={() => {
                navigate(
                  `/watch-party?videoId=${encodeURIComponent(video.id)}`,
                )
              }}
            >
              {t('watchParty.startFromVideo')}
            </button>
            <AddToPlaylistButton
              playlistService={playlistService}
              videoId={video.id}
            />
          </div>

          <div className="watch-channel-row">
            <Link
              className="watch-channel-identity"
              to={`/channels/${video.channelId}`}
              aria-label={video.channelName}
            >
              <div className="watch-channel-avatar">
                {video.channelAvatarPath ? (
                  <img src={video.channelAvatarPath} alt="" />
                ) : (
                  <span>
                    {video.channelName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="watch-channel-copy">
                <strong>{video.channelName}</strong>
                <span>
                  {subscriberCount} {t('system.channels.subscribers')}
                </span>
              </div>
            </Link>

            {!isOwnChannel && (
              <button
                type="button"
                className="watch-start-party-button"
                disabled={isSubscriptionBusy}
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

          {video.description && (
            <div className="watch-description">
              <p>{video.description}</p>
            </div>
          )}

          <CommentsSection
            key={video.id}
            videoId={video.id}
          />
        </div>
      </div>

      <aside className="watch-side-panel">
        <div className="watch-side-card">
          <span className="watch-side-label">
            {t('watch.upNext')}
          </span>
          <h2>{t('watch.recommendations')}</h2>

          {loadState.recommendations.length === 0 ? (
            <p>{t('watch.noRecommendations')}</p>
          ) : (
            <div className="watch-recommendations">
              {loadState.recommendations.map((recommendation) => {
                const recommendationViews = formatViews(
                  recommendation.viewCount,
                  locale,
                )

                return (
                  <button
                    key={recommendation.id}
                    type="button"
                    className="watch-recommendation"
                    onClick={() =>
                      navigate(`/watch/${recommendation.id}`)}
                  >
                    <div className="watch-recommendation-thumbnail">
                      {recommendation.thumbnailPath ? (
                        <img src={recommendation.thumbnailPath} alt="" />
                      ) : (
                        <span>A</span>
                      )}
                      <small>
                        {formatDuration(recommendation.durationSeconds)}
                      </small>
                    </div>
                    <div className="watch-recommendation-copy">
                      <strong>{recommendation.title}</strong>
                      <span>{recommendation.channelName}</span>
                      <span>
                        {t('watch.views', {
                          count: recommendation.viewCount,
                          formatted: recommendationViews,
                        })}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </section>
  )
}

export default WatchPage
