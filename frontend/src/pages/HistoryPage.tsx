import {
  useEffect,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import {
  clearWatchHistory,
  getHistoryStatus,
  getWatchHistory,
  removeHistoryItem,
  setHistoryPaused,
  type HistoryStatus,
  type WatchHistoryItem,
} from '../api/library'
import {
  useAppTranslation,
} from '../i18n'
import './DiscoveryPage.css'
import './LibraryPages.css'

interface HistoryState {
  requestKey: string
  items: WatchHistoryItem[]
  status: HistoryStatus
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

function formatWatchedDate(
  value: string,
  locale: string,
) {
  return new Intl.DateTimeFormat(
    locale,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    new Date(value),
  )
}

function HistoryPage() {
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
    reloadToken,
    setReloadToken,
  ] = useState(0)

  const [
    state,
    setState,
  ] =
    useState<HistoryState | null>(
      null,
    )

  const [
    query,
    setQuery,
  ] = useState('')

  const [
    actionPending,
    setActionPending,
  ] = useState(false)

  const [
    actionErrorKey,
    setActionErrorKey,
  ] =
    useState<string | null>(
      null,
    )

  const [
    clearConfirmOpen,
    setClearConfirmOpen,
  ] = useState(false)

  const requestKey =
    `history:${reloadToken}`

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

    return key
      ? t(key)
      : category
  }

  useEffect(() => {
    const controller =
      new AbortController()

    void Promise.all([
      getWatchHistory(
        controller.signal,
      ),
      getHistoryStatus(
        controller.signal,
      ),
    ])
      .then(
        ([
          items,
          status,
        ]) => {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setState({
            requestKey,
            items,
            status,
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
          items: [],
          status: {
            isPaused: false,
          },
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

  useEffect(() => {
    if (!clearConfirmOpen) {
      return
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
          'Escape' &&
        !actionPending
      ) {
        setClearConfirmOpen(
          false,
        )
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    clearConfirmOpen,
    actionPending,
  ])

  const isCurrentRequest =
    state?.requestKey ===
    requestKey

  const isLoading =
    !isCurrentRequest

  const isError =
    isCurrentRequest &&
    state?.error === true

  const items =
    isCurrentRequest &&
    !state?.error
      ? state?.items ?? []
      : []

  const historyStatus =
    isCurrentRequest &&
    !state?.error
      ? state?.status ?? {
          isPaused: false,
        }
      : {
          isPaused: false,
        }

  const normalizedQuery =
    query
      .trim()
      .toLowerCase()

  const filteredItems =
    normalizedQuery
      ? items.filter(
          (item) => {
            const category =
              item.video.category ??
              ''

            const translatedCategory =
              getCategoryLabel(
                item.video.category,
              )

            return (
              item.video.title
                .toLowerCase()
                .includes(
                  normalizedQuery,
                ) ||
              item.video.channelName
                .toLowerCase()
                .includes(
                  normalizedQuery,
                ) ||
              category
                .toLowerCase()
                .includes(
                  normalizedQuery,
                ) ||
              translatedCategory
                .toLowerCase()
                .includes(
                  normalizedQuery,
                )
            )
          },
        )
      : items

  const handlePauseToggle =
    async () => {
      if (actionPending) {
        return
      }

      try {
        setActionErrorKey(
          null,
        )
        setActionPending(
          true,
        )

        const status =
          await setHistoryPaused(
            !historyStatus.isPaused,
          )

        setState(
          (current) => {
            if (!current) {
              return current
            }

            return {
              ...current,
              status,
            }
          },
        )
      } catch {
        setActionErrorKey(
          'library.history.statusChangeFailed',
        )
      } finally {
        setActionPending(
          false,
        )
      }
    }

  const handleRemove =
    async (
      videoId: string,
    ) => {
      if (actionPending) {
        return
      }

      try {
        setActionErrorKey(
          null,
        )
        setActionPending(
          true,
        )

        await removeHistoryItem(
          videoId,
        )

        setState(
          (current) => {
            if (!current) {
              return current
            }

            return {
              ...current,
              items:
                current.items.filter(
                  (item) =>
                    item.videoId !==
                    videoId,
                ),
            }
          },
        )
      } catch {
        setActionErrorKey(
          'library.history.removeFailed',
        )
      } finally {
        setActionPending(
          false,
        )
      }
    }

  const handleOpenClearConfirm =
    () => {
      if (
        actionPending ||
        items.length === 0
      ) {
        return
      }

      setActionErrorKey(
        null,
      )
      setClearConfirmOpen(
        true,
      )
    }

  const handleCloseClearConfirm =
    () => {
      if (actionPending) {
        return
      }

      setClearConfirmOpen(
        false,
      )
    }

  const handleConfirmClear =
    async () => {
      if (
        actionPending ||
        items.length === 0
      ) {
        return
      }

      try {
        setActionErrorKey(
          null,
        )
        setActionPending(
          true,
        )

        await clearWatchHistory()

        setState(
          (current) => {
            if (!current) {
              return current
            }

            return {
              ...current,
              items: [],
            }
          },
        )

        setClearConfirmOpen(
          false,
        )
      } catch {
        setActionErrorKey(
          'library.history.clearFailed',
        )
      } finally {
        setActionPending(
          false,
        )
      }
    }

  return (
    <div className="discovery-page library-page">
      <header className="discovery-header library-header">
        <div>
          <span className="discovery-eyebrow">
            {t(
              'library.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'library.history.title',
            )}
          </h1>

          <p>
            {t(
              'library.history.description',
            )}
          </p>
        </div>

        {!isLoading &&
          !isError && (
            <div className="library-header-actions">
              <button
                type="button"
                className={
                  historyStatus
                    .isPaused
                    ? 'library-action-button is-active'
                    : 'library-action-button'
                }
                disabled={
                  actionPending
                }
                onClick={
                  handlePauseToggle
                }
              >
                {historyStatus
                  .isPaused
                  ? t(
                      'library.history.resume',
                    )
                  : t(
                      'library.history.pause',
                    )}
              </button>

              <button
                type="button"
                className="library-action-button danger"
                disabled={
                  actionPending ||
                  items.length === 0
                }
                onClick={
                  handleOpenClearConfirm
                }
              >
                {t(
                  'library.history.clear',
                )}
              </button>
            </div>
          )}
      </header>

      {!isLoading &&
        !isError && (
          <div className="library-toolbar">
            <div className="library-search">
              <span>
                ⌕
              </span>

              <input
                type="search"
                value={query}
                placeholder={t(
                  'library.history.searchPlaceholder',
                )}
                onChange={(
                  event,
                ) =>
                  setQuery(
                    event.target
                      .value,
                  )
                }
              />
            </div>

            <span className="library-count">
              {t(
                'library.video',
                {
                  count:
                    items.length,
                },
              )}
            </span>
          </div>
        )}

      {actionErrorKey && (
        <div className="library-inline-error">
          {t(
            actionErrorKey,
          )}
        </div>
      )}

      {isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            {t(
              'library.history.loading',
            )}
          </span>
        </div>
      ) : isError ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            {t(
              'library.history.loadFailed',
            )}
          </strong>

          <span>
            {t(
              'library.history.backendHint',
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
      ) : items.length ===
        0 ? (
        <div className="discovery-state">
          <strong>
            {t(
              'library.history.empty',
            )}
          </strong>

          <span>
            {t(
              'library.history.emptyHint',
            )}
          </span>
        </div>
      ) : filteredItems.length ===
        0 ? (
        <div className="discovery-state">
          <strong>
            {t(
              'library.history.nothingFound',
            )}
          </strong>

          <span>
            {t(
              'library.history.noMatch',
              {
                query,
              },
            )}
          </span>
        </div>
      ) : (
        <div className="library-video-list">
          {filteredItems.map(
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

                      <span>
                        {formatWatchedDate(
                          item.lastWatchedAt,
                          locale,
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="library-remove-button"
                    disabled={
                      actionPending
                    }
                    onClick={() =>
                      void handleRemove(
                        item.videoId,
                      )
                    }
                  >
                    {t(
                      'library.remove',
                    )}
                  </button>
                </article>
              )
            },
          )}
        </div>
      )}

      {clearConfirmOpen && (
        <div
          className="history-confirm-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseClearConfirm()
            }
          }}
        >
          <div
            className="history-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-clear-title"
            aria-describedby="history-clear-description"
          >
            <div
              className="history-confirm-icon"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
              >
                <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7m4-7v7" />
              </svg>
            </div>

            <span className="history-confirm-eyebrow">
              {t(
                'library.history.modalEyebrow',
              )}
            </span>

            <h2 id="history-clear-title">
              {t(
                'library.history.modalTitle',
              )}
            </h2>

            <p id="history-clear-description">
              {t(
                'library.history.modalDescription',
              )}
            </p>

            <div className="history-confirm-actions">
              <button
                type="button"
                className="history-confirm-button"
                disabled={
                  actionPending
                }
                onClick={
                  handleCloseClearConfirm
                }
              >
                {t(
                  'library.history.cancel',
                )}
              </button>

              <button
                type="button"
                className="history-confirm-button danger"
                disabled={
                  actionPending
                }
                onClick={() =>
                  void handleConfirmClear()
                }
              >
                {actionPending
                  ? t(
                      'library.history.clearing',
                    )
                  : t(
                      'library.history.clear',
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
