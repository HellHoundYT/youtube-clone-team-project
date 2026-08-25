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
  LibraryService,
} from '../../application/library/service'
import type {
  VideoService,
} from '../../application/video/service'
import type {
  VideoDetails,
  VideoListItem,
} from '../../domain/video/types'
import VideoPlayer from '../components/video/VideoPlayer'
import CommentsSection from '../components/comments/CommentsSection'
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

const categoryKeys:
Record<string, string> = {
  Music:
    'common.category.music',
  Games:
    'common.category.games',
  Cybersport:
    'common.category.cybersport',
  Education:
    'common.category.education',
  Films:
    'common.category.films',
  Podcasts:
    'common.category.podcasts',
  Mixes:
    'common.category.mixes',
}

function formatDuration(
  seconds: number,
) {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(seconds),
    )

  const hours =
    Math.floor(
      safeSeconds / 3600,
    )

  const minutes =
    Math.floor(
      (
        safeSeconds %
        3600
      ) / 60,
    )

  const remainingSeconds =
    safeSeconds % 60

  if (hours > 0) {
    return [
      hours,
      minutes
        .toString()
        .padStart(
          2,
          '0',
        ),
      remainingSeconds
        .toString()
        .padStart(
          2,
          '0',
        ),
    ].join(':')
  }

  return [
    minutes,
    remainingSeconds
      .toString()
      .padStart(
        2,
        '0',
      ),
  ].join(':')
}

function getLocale(
  language:
    | string
    | undefined,
) {
  return language
    ?.toLowerCase()
    .startsWith('uk')
    ? 'uk-UA'
    : 'en-US'
}

function formatViews(
  viewCount: number,
  locale: string,
) {
  return new Intl.NumberFormat(
    locale,
    {
      notation:
        'compact',

      maximumFractionDigits:
        1,
    },
  ).format(
    viewCount,
  )
}

function formatPublishedDate(
  value:
    | string
    | null,
  locale: string,
  fallback: string,
) {
  if (!value) {
    return fallback
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      year:
        'numeric',

      month:
        'short',

      day:
        'numeric',
    },
  ).format(
    new Date(
      value,
    ),
  )
}

interface WatchPageProps {
  libraryService: LibraryService
  videoService: VideoService
}

function WatchPage({
  libraryService,
  videoService,
}: WatchPageProps) {
  const {
    videoId,
  } =
    useParams()

  const navigate =
    useNavigate()

  const {
    t,
    i18n,
  } =
    useAppTranslation()

  const locale =
    getLocale(
      i18n.resolvedLanguage,
    )

  const [
    loadState,
    setLoadState,
  ] =
    useState<WatchLoadState | null>(
      null,
    )

  useEffect(() => {
    if (!videoId) {
      return
    }

    const controller =
      new AbortController()

    const loadWatchPage =
      async () => {
        try {
          const video =
            await videoService.getVideoById(
              videoId,
              controller.signal,
            )

          let recommendations:
            VideoListItem[] = []

          let initialProgressSeconds =
            0

          try {
            recommendations =
              await videoService.getVideoRecommendations(
                video,
                controller.signal,
              )
          } catch {
            if (
              controller.signal
                .aborted
            ) {
              return
            }
          }

          try {
            const history =
              await libraryService.getWatchHistory(
                controller.signal,
              )

            const historyItem =
              history.find(
                (item) =>
                  item.videoId ===
                  video.id,
              )

            if (
              historyItem &&
              !historyItem.completed
            ) {
              initialProgressSeconds =
                historyItem
                  .progressSeconds
            }
          } catch {
            if (
              controller.signal
                .aborted
            ) {
              return
            }
          }

          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setLoadState({
            videoId,
            video,
            recommendations,
            initialProgressSeconds,
            error: false,
          })
        } catch {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setLoadState({
            videoId,
            video: null,
            recommendations: [],
            initialProgressSeconds:
              0,
            error: true,
          })
        }
      }

    void loadWatchPage()

    return () => {
      controller.abort()
    }
  }, [
    libraryService,
    videoId,
    videoService,
  ])

  if (!videoId) {
    return (
      <section className="watch-page">
        <div className="watch-state watch-error-state">
          <span className="watch-state-code">
            400
          </span>

          <h1>
            {t(
              'watch.unavailable',
            )}
          </h1>

          <p>
            {t(
              'watch.missingId',
            )}
          </p>

          <Link
            className="watch-back-link"
            to="/"
          >
            {t(
              'watch.backHome',
            )}
          </Link>
        </div>
      </section>
    )
  }

  const isLoading =
    loadState?.videoId !==
    videoId

  if (isLoading) {
    return (
      <section className="watch-page">
        <div className="watch-state">
          <div className="watch-loading-spinner" />

          <p>
            {t(
              'watch.loading',
            )}
          </p>
        </div>
      </section>
    )
  }

  if (
    loadState.error ||
    !loadState.video
  ) {
    return (
      <section className="watch-page">
        <div className="watch-state watch-error-state">
          <span className="watch-state-code">
            404
          </span>

          <h1>
            {t(
              'watch.unavailable',
            )}
          </h1>

          <p>
            {loadState.error
              ? t(
                  'watch.loadError',
                )
              : t(
                  'watch.notFound',
                )}
          </p>

          <Link
            className="watch-back-link"
            to="/"
          >
            {t(
              'watch.backHome',
            )}
          </Link>
        </div>
      </section>
    )
  }

  const video =
    loadState.video

  const formattedViews =
    formatViews(
      video.viewCount,
      locale,
    )

  const categoryLabel =
    video.category
      ? t(
          categoryKeys[
            video.category
          ] ??
            video.category,
          {
            defaultValue:
              video.category,
          },
        )
      : null

  const visibilityKey =
    `common.visibility.${video.visibility.toLowerCase()}`

  const visibilityLabel =
    t(
      visibilityKey,
      {
        defaultValue:
          video.visibility,
      },
    )

  const handleFirstPlay =
    async () => {
      try {
        await videoService.registerVideoView(
          video.id,
        )

        setLoadState(
          (current) => {
            if (
              !current ||
              current.videoId !==
                video.id ||
              !current.video
            ) {
              return current
            }

            return {
              ...current,

              video: {
                ...current.video,

                viewCount:
                  current.video
                    .viewCount +
                  1,
              },
            }
          },
        )
      } catch {
        // Playback must not be
        // interrupted by a view
        // counter failure.
      }
    }

  const handleProgress =
    async (
      currentTime: number,
      duration: number,
      completed: boolean,
    ) => {
      try {
        await libraryService.updateWatchHistory(
          video.id,
          {
            progressSeconds:
              completed
                ? duration
                : currentTime,

            completed,
          },
        )
      } catch {
        // History errors must not
        // interrupt playback.
      }
    }

  return (
    <section className="watch-page">
      <div className="watch-main-column">
        <VideoPlayer
          src={
            video.videoPath
          }
          title={
            video.title
          }
          poster={
            video.thumbnailPath
          }
          initialTime={
            loadState
              .initialProgressSeconds
          }
          onFirstPlay={() => {
            void handleFirstPlay()
          }}
          onProgress={(
            currentTime,
            duration,
            completed,
          ) => {
            void handleProgress(
              currentTime,
              duration,
              completed,
            )
          }}
        />

        <div className="watch-video-info">
          <div className="watch-video-heading">
            <div>
              {categoryLabel && (
                <span className="watch-category">
                  {
                    categoryLabel
                  }
                </span>
              )}

              <h1>
                {video.title}
              </h1>
            </div>

            <span className="watch-visibility">
              {
                visibilityLabel
              }
            </span>
          </div>

          <div className="watch-video-meta">
            <span>
              {t(
                'watch.views',
                {
                  count:
                    video.viewCount,

                  formatted:
                    formattedViews,
                },
              )}
            </span>

            <span className="watch-meta-dot" />

            <span>
              {formatPublishedDate(
                video.publishedAt,
                locale,
                t(
                  'watch.notPublished',
                ),
              )}
            </span>
          </div>

          <div className="watch-party-action-row">
            <button
              type="button"
              className="watch-start-party-button"
              onClick={() => {
                navigate(
                  `/watch-party?videoId=${encodeURIComponent(video.id)}`,
                )
              }}
            >
              {t(
                'watchParty.startFromVideo',
              )}
            </button>
          </div>

          <div className="watch-channel-row">
            <div className="watch-channel-identity">
              <div className="watch-channel-avatar">
                {video.channelAvatarPath ? (
                  <img
                    src={
                      video.channelAvatarPath
                    }
                    alt=""
                  />
                ) : (
                  <span>
                    {video.channelName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="watch-channel-copy">
                <strong>
                  {
                    video.channelName
                  }
                </strong>

                <span>
                  {t(
                    'watch.channel',
                  )}
                </span>
              </div>
            </div>
          </div>

          {video.description && (
            <div className="watch-description">
              <p>
                {
                  video.description
                }
              </p>
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
            {t(
              'watch.upNext',
            )}
          </span>

          <h2>
            {t(
              'watch.recommendations',
            )}
          </h2>

          {loadState
            .recommendations
            .length === 0 ? (
            <p>
              {t(
                'watch.noRecommendations',
              )}
            </p>
          ) : (
            <div className="watch-recommendations">
              {loadState
                .recommendations
                .map(
                  (
                    recommendation,
                  ) => {
                    const recommendationViews =
                      formatViews(
                        recommendation.viewCount,
                        locale,
                      )

                    return (
                      <button
                        key={
                          recommendation.id
                        }
                        type="button"
                        className="watch-recommendation"
                        onClick={() =>
                          navigate(
                            `/watch/${recommendation.id}`,
                          )
                        }
                      >
                        <div className="watch-recommendation-thumbnail">
                          {recommendation.thumbnailPath ? (
                            <img
                              src={
                                recommendation.thumbnailPath
                              }
                              alt=""
                            />
                          ) : (
                            <span>
                              A
                            </span>
                          )}

                          <small>
                            {formatDuration(
                              recommendation.durationSeconds,
                            )}
                          </small>
                        </div>

                        <div className="watch-recommendation-copy">
                          <strong>
                            {
                              recommendation.title
                            }
                          </strong>

                          <span>
                            {
                              recommendation.channelName
                            }
                          </span>

                          <span>
                            {t(
                              'watch.views',
                              {
                                count:
                                  recommendation.viewCount,

                                formatted:
                                  recommendationViews,
                              },
                            )}
                          </span>
                        </div>
                      </button>
                    )
                  },
                )}
            </div>
          )}
        </div>
      </aside>
    </section>
  )
}

export default WatchPage
