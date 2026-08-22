import {
  useEffect,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import {
  getFavorites,
  getWatchHistory,
  type FavoriteItem,
  type WatchHistoryItem,
} from '../api/library'
import './DiscoveryPage.css'
import './LibraryPages.css'

interface LibraryState {
  requestKey: string
  history: WatchHistoryItem[]
  favorites: FavoriteItem[]
  error: boolean
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

function LibraryPage() {
  const navigate =
    useNavigate()

  const [
    reloadToken,
    setReloadToken,
  ] = useState(0)

  const [
    state,
    setState,
  ] =
    useState<LibraryState | null>(
      null,
    )

  const requestKey =
    `library:${reloadToken}`

  useEffect(() => {
    const controller =
      new AbortController()

    void Promise.all([
      getWatchHistory(
        controller.signal,
      ),
      getFavorites(
        controller.signal,
      ),
    ])
      .then(
        ([
          history,
          favorites,
        ]) => {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setState({
            requestKey,
            history,
            favorites,
            error: false,
          })
        },
      )
      .catch(() => {
        if (
          controller.signal
            .aborted
        ) {
          return
        }

        setState({
          requestKey,
          history: [],
          favorites: [],
          error: true,
        })
      })

    return () => {
      controller.abort()
    }
  }, [
    reloadToken,
    requestKey,
  ])

  const isCurrentRequest =
    state?.requestKey ===
    requestKey

  const isLoading =
    !isCurrentRequest

  const isError =
    isCurrentRequest &&
    state?.error === true

  const history =
    isCurrentRequest &&
    !state?.error
      ? state?.history ?? []
      : []

  const favorites =
    isCurrentRequest &&
    !state?.error
      ? state?.favorites ?? []
      : []

  const recentHistory =
    history.slice(
      0,
      3,
    )

  const recentFavorites =
    favorites.slice(
      0,
      3,
    )

  return (
    <div className="discovery-page library-page">
      <header className="discovery-header library-header">
        <div>
          <span className="discovery-eyebrow">
            YOUR CONTENT
          </span>

          <h1>
            Library
          </h1>

          <p>
            Your recently watched,
            favorite and saved
            content in one place.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            Loading library...
          </span>
        </div>
      ) : isError ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            Library failed to load
          </strong>

          <span>
            Make sure the backend
            is running and try
            again.
          </span>

          <button
            type="button"
            onClick={() =>
              setReloadToken(
                (value) =>
                  value + 1,
              )
            }
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="home-section">
            <div className="content-section-header">
              <div>
                <h2>
                  Watch History
                </h2>

                <p className="library-count">
                  {history.length}{' '}
                  {history.length === 1
                    ? 'video'
                    : 'videos'}
                </p>
              </div>

              <button
                type="button"
                className="library-action-button"
                onClick={() =>
                  navigate(
                    '/history',
                  )
                }
              >
                View all
              </button>
            </div>

            {recentHistory.length ===
            0 ? (
              <div className="discovery-state">
                <strong>
                  History is empty
                </strong>

                <span>
                  Start watching
                  videos and they
                  will appear here.
                </span>
              </div>
            ) : (
              <div className="library-video-list">
                {recentHistory.map(
                  (item) => {
                    const duration =
                      Math.max(
                        1,
                        item.video
                          .durationSeconds,
                      )

                    const progress =
                      Math.min(
                        100,
                        Math.max(
                          0,
                          (
                            item.progressSeconds /
                            duration
                          ) *
                            100,
                        ),
                      )

                    return (
                      <article
                        key={
                          item.videoId
                        }
                        className="library-video-row"
                      >
                        <button
                          type="button"
                          className="library-video-thumbnail"
                          onClick={() =>
                            navigate(
                              `/watch/${item.videoId}`,
                            )
                          }
                        >
                          {item.video
                            .thumbnailPath ? (
                            <img
                              src={
                                item.video
                                  .thumbnailPath
                              }
                              alt=""
                            />
                          ) : (
                            <span className="library-thumbnail-placeholder">
                              A
                            </span>
                          )}

                          <span className="library-duration">
                            {formatDuration(
                              item.video
                                .durationSeconds,
                            )}
                          </span>

                          <span className="library-progress-track">
                            <span
                              style={{
                                width:
                                  `${progress}%`,
                              }}
                            />
                          </span>
                        </button>

                        <div className="library-video-copy">
                          <button
                            type="button"
                            className="library-video-title"
                            onClick={() =>
                              navigate(
                                `/watch/${item.videoId}`,
                              )
                            }
                          >
                            {
                              item.video
                                .title
                            }
                          </button>

                          <span className="library-video-channel">
                            {
                              item.video
                                .channelName
                            }
                          </span>

                          <div className="library-video-meta">
                            <span>
                              {item.completed
                                ? 'Completed'
                                : `${formatDuration(
                                    item.progressSeconds,
                                  )} watched`}
                            </span>

                            <span>
                              {
                                item.video
                                  .category ??
                                'Uncategorized'
                              }
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="library-action-button"
                          onClick={() =>
                            navigate(
                              `/watch/${item.videoId}`,
                            )
                          }
                        >
                          Continue
                        </button>
                      </article>
                    )
                  },
                )}
              </div>
            )}
          </section>

          <section className="home-section">
            <div className="content-section-header">
              <div>
                <h2>
                  Favorites
                </h2>

                <p className="library-count">
                  {favorites.length}{' '}
                  {favorites.length === 1
                    ? 'video'
                    : 'videos'}
                </p>
              </div>

              <button
                type="button"
                className="library-action-button"
                onClick={() =>
                  navigate(
                    '/favorites',
                  )
                }
              >
                View all
              </button>
            </div>

            {recentFavorites.length ===
            0 ? (
              <div className="discovery-state">
                <strong>
                  No favorites yet
                </strong>

                <span>
                  Videos added to
                  Favorites will
                  appear here.
                </span>
              </div>
            ) : (
              <div className="library-video-list">
                {recentFavorites.map(
                  (item) => (
                    <article
                      key={
                        item.videoId
                      }
                      className="library-video-row"
                    >
                      <button
                        type="button"
                        className="library-video-thumbnail"
                        onClick={() =>
                          navigate(
                            `/watch/${item.videoId}`,
                          )
                        }
                      >
                        {item.video
                          .thumbnailPath ? (
                          <img
                            src={
                              item.video
                                .thumbnailPath
                            }
                            alt=""
                          />
                        ) : (
                          <span className="library-thumbnail-placeholder">
                            A
                          </span>
                        )}

                        <span className="library-duration">
                          {formatDuration(
                            item.video
                              .durationSeconds,
                          )}
                        </span>
                      </button>

                      <div className="library-video-copy">
                        <button
                          type="button"
                          className="library-video-title"
                          onClick={() =>
                            navigate(
                              `/watch/${item.videoId}`,
                            )
                          }
                        >
                          {
                            item.video
                              .title
                          }
                        </button>

                        <span className="library-video-channel">
                          {
                            item.video
                              .channelName
                          }
                        </span>

                        <div className="library-video-meta">
                          <span>
                            {
                              item.video
                                .category ??
                              'Uncategorized'
                            }
                          </span>

                          <span>
                            Favorite
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="library-action-button"
                        onClick={() =>
                          navigate(
                            `/watch/${item.videoId}`,
                          )
                        }
                      >
                        Watch
                      </button>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="home-section">
            <div className="content-section-header">
              <div>
                <h2>
                  Playlists
                </h2>

                <p className="library-count">
                  Integration point
                </p>
              </div>

              <button
                type="button"
                className="library-action-button"
                onClick={() =>
                  navigate(
                    '/playlists',
                  )
                }
              >
                Open
              </button>
            </div>

            <div className="discovery-state">
              <strong>
                Playlists will appear here
              </strong>

              <span>
                Playlist functionality
                is implemented in a
                separate module and
                will be connected to
                Library through this
                section.
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default LibraryPage