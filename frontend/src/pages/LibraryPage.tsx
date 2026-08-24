import {
  useEffect,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import type {
  LibraryService,
} from '../application/library/service'
import type {
  FavoriteItem,
} from '../domain/favorite/types'
import type {
  WatchHistoryItem,
} from '../domain/history/types'
import {
  useAppTranslation,
} from '../shared/i18n'
import './DiscoveryPage.css'
import './LibraryPages.css'

interface LibraryState {
  requestKey: string
  history: WatchHistoryItem[]
  favorites: FavoriteItem[]
  error: boolean
}

const categoryKeys:
Record<string, string> = {
  Music: 'common.category.music',
  Games: 'common.category.games',
  Cybersport: 'common.category.cybersport',
  Education: 'common.category.education',
  Films: 'common.category.films',
  Podcasts: 'common.category.podcasts',
  Mixes: 'common.category.mixes',
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

interface LibraryPageProps {
  libraryService: LibraryService
}

function LibraryPage({
  libraryService,
}: LibraryPageProps) {
  const navigate =
    useNavigate()

  const {
    t,
  } =
    useAppTranslation()

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
      libraryService.getWatchHistory(
        controller.signal,
      ),
      libraryService.getFavorites(
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
    libraryService,
    reloadToken,
    requestKey,
  ])

  const getCategoryLabel = (
    category:
      | string
      | null,
  ) => {
    if (!category) {
      return t(
        'common.category.uncategorized',
      )
    }

    const key =
      categoryKeys[
        category
      ]

    if (!key) {
      return category
    }

    return t(key)
  }

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
            {t(
              'library.yourContent',
            )}
          </span>

          <h1>
            {t(
              'library.page.title',
            )}
          </h1>

          <p>
            {t(
              'library.page.description',
            )}
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            {t(
              'library.page.loading',
            )}
          </span>
        </div>
      ) : isError ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            {t(
              'library.page.loadFailed',
            )}
          </strong>

          <span>
            {t(
              'library.page.backendHint',
            )}
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
            {t(
              'common.retry',
            )}
          </button>
        </div>
      ) : (
        <>
          <section className="home-section">
            <div className="content-section-header">
              <div>
                <h2>
                  {t(
                    'library.page.watchHistory',
                  )}
                </h2>

                <p className="library-count">
                  {t(
                    'library.video',
                    {
                      count:
                        history.length,
                    },
                  )}
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
                {t(
                  'library.viewAll',
                )}
              </button>
            </div>

            {recentHistory.length ===
            0 ? (
              <div className="discovery-state">
                <strong>
                  {t(
                    'library.page.historyEmpty',
                  )}
                </strong>

                <span>
                  {t(
                    'library.page.historyEmptyHint',
                  )}
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
                                ? t(
                                    'library.completed',
                                  )
                                : t(
                                    'library.watched',
                                    {
                                      duration:
                                        formatDuration(
                                          item.progressSeconds,
                                        ),
                                    },
                                  )}
                            </span>

                            <span>
                              {getCategoryLabel(
                                item.video
                                  .category,
                              )}
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
                          {t(
                            'library.continue',
                          )}
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
                  {t(
                    'library.page.favorites',
                  )}
                </h2>

                <p className="library-count">
                  {t(
                    'library.video',
                    {
                      count:
                        favorites.length,
                    },
                  )}
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
                {t(
                  'library.viewAll',
                )}
              </button>
            </div>

            {recentFavorites.length ===
            0 ? (
              <div className="discovery-state">
                <strong>
                  {t(
                    'library.page.favoritesEmpty',
                  )}
                </strong>

                <span>
                  {t(
                    'library.page.favoritesEmptyHint',
                  )}
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
                            {getCategoryLabel(
                              item.video
                                .category,
                            )}
                          </span>

                          <span>
                            {t(
                              'layout.navigation.favorites',
                            )}
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
                        {t(
                          'library.watch',
                        )}
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
                  {t(
                    'library.page.playlists',
                  )}
                </h2>

                <p className="library-count">
                  {t(
                    'library.page.integrationPoint',
                  )}
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
                {t(
                  'library.open',
                )}
              </button>
            </div>

            <div className="discovery-state">
              <strong>
                {t(
                  'library.page.playlistsComing',
                )}
              </strong>

              <span>
                {t(
                  'library.page.playlistsHint',
                )}
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default LibraryPage
