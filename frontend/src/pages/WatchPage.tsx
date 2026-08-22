import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  getWatchHistory,
  updateWatchHistory,
} from '../api/library'
import {
  getVideoById,
  getVideoRecommendations,
  registerVideoView,
  type VideoDetails,
  type VideoListItem,
} from '../api/videos'
import VideoPlayer from '../components/video/VideoPlayer'
import './WatchPage.css'

interface WatchLoadState {
  videoId: string
  video: VideoDetails | null
  recommendations: VideoListItem[]
  initialProgressSeconds: number
  error: string | null
}

function formatViews(
  viewCount: number,
) {
  return new Intl.NumberFormat(
    'en-US',
    {
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  ).format(viewCount)
}

function formatPublishedDate(
  value: string | null,
) {
  if (!value) {
    return 'Not published'
  }

  const date = new Date(value)

  return new Intl.DateTimeFormat(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  ).format(date)
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
      (safeSeconds % 3600) /
        60,
    )

  const remainingSeconds =
    safeSeconds % 60

  if (hours > 0) {
    return [
      hours,
      minutes
        .toString()
        .padStart(2, '0'),
      remainingSeconds
        .toString()
        .padStart(2, '0'),
    ].join(':')
  }

  return [
    minutes,
    remainingSeconds
      .toString()
      .padStart(2, '0'),
  ].join(':')
}

function WatchPage() {
  const { videoId } =
    useParams()

  const navigate =
    useNavigate()

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
            await getVideoById(
              videoId,
              controller.signal,
            )

          let recommendations:
            VideoListItem[] = []

          let initialProgressSeconds =
            0

          try {
            recommendations =
              await getVideoRecommendations(
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
              await getWatchHistory(
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

            // History must never
            // prevent video playback.
          }

          if (
            controller.signal.aborted
          ) {
            return
          }

          setLoadState({
            videoId,
            video,
            recommendations,
            initialProgressSeconds,
            error: null,
          })
        } catch {
          if (
            controller.signal.aborted
          ) {
            return
          }

          setLoadState({
            videoId,
            video: null,
            recommendations: [],
            initialProgressSeconds:
              0,
            error:
              'The video could not be loaded.',
          })
        }
      }

    void loadWatchPage()

    return () => {
      controller.abort()
    }
  }, [videoId])

  if (!videoId) {
    return (
      <section className="watch-page">
        <div className="watch-state watch-error-state">
          <span className="watch-state-code">
            400
          </span>

          <h1>
            Video unavailable
          </h1>

          <p>
            Video identifier is missing.
          </p>

          <Link
            className="watch-back-link"
            to="/"
          >
            Back to Home
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
            Loading video...
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
            Video unavailable
          </h1>

          <p>
            {loadState.error ??
              'The requested video does not exist.'}
          </p>

          <Link
            className="watch-back-link"
            to="/"
          >
            Back to Home
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
    )

  const handleFirstPlay =
    async () => {
      try {
        await registerVideoView(
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
                    .viewCount + 1,
              },
            }
          },
        )
      } catch {
        // A failed view counter must
        // never interrupt playback.
      }
    }

  const handleProgress =
    async (
      currentTime: number,
      duration: number,
      completed: boolean,
    ) => {
      try {
        await updateWatchHistory(
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
        // History errors must never
        // interrupt playback.
      }
    }

  return (
    <section className="watch-page">
      <div className="watch-main-column">
        <VideoPlayer
          src={video.videoPath}
          title={video.title}
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
              {video.category && (
                <span className="watch-category">
                  {video.category}
                </span>
              )}

              <h1>
                {video.title}
              </h1>
            </div>

            <span className="watch-visibility">
              {video.visibility}
            </span>
          </div>

          <div className="watch-video-meta">
            <span>
              {formattedViews} views
            </span>

            <span className="watch-meta-dot" />

            <span>
              {formatPublishedDate(
                video.publishedAt,
              )}
            </span>
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
                  {video.channelName}
                </strong>

                <span>
                  Channel
                </span>
              </div>
            </div>
          </div>

          {video.description && (
            <div className="watch-description">
              <p>
                {video.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="watch-side-panel">
        <div className="watch-side-card">
          <span className="watch-side-label">
            Up next
          </span>

          <h2>
            Recommendations
          </h2>

          {loadState
            .recommendations
            .length === 0 ? (
            <p>
              No recommendations
              are available yet.
            </p>
          ) : (
            <div className="watch-recommendations">
              {loadState
                .recommendations
                .map(
                  (
                    recommendation,
                  ) => (
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
                          {formatViews(
                            recommendation.viewCount,
                          )}{' '}
                          views
                        </span>
                      </div>
                    </button>
                  ),
                )}
            </div>
          )}
        </div>
      </aside>
    </section>
  )
}

export default WatchPage