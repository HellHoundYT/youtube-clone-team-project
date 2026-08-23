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
import './DiscoveryPage.css'
import './LibraryPages.css'

interface HistoryState {
  requestKey: string
  items: WatchHistoryItem[]
  status: HistoryStatus
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

function formatWatchedDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'en-US',
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
    actionError,
    setActionError,
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
        event.key === 'Escape' &&
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
    query.trim().toLowerCase()

  const filteredItems =
    normalizedQuery
      ? items.filter(
          (item) =>
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
            (
              item.video.category ??
              ''
            )
              .toLowerCase()
              .includes(
                normalizedQuery,
              ),
        )
      : items

  const handlePauseToggle =
    async () => {
      if (actionPending) {
        return
      }

      try {
        setActionError(null)
        setActionPending(true)

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
        setActionError(
          'History status could not be changed.',
        )
      } finally {
        setActionPending(false)
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
        setActionError(null)
        setActionPending(true)

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
        setActionError(
          'History item could not be removed.',
        )
      } finally {
        setActionPending(false)
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

      setActionError(null)
      setClearConfirmOpen(true)
    }

  const handleCloseClearConfirm =
    () => {
      if (actionPending) {
        return
      }

      setClearConfirmOpen(false)
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
        setActionError(null)
        setActionPending(true)

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

        setClearConfirmOpen(false)
      } catch {
        setActionError(
          'Watch history could not be cleared.',
        )
      } finally {
        setActionPending(false)
      }
    }

  return (
    <div className="discovery-page library-page">
      <header className="discovery-header library-header">
        <div>
          <span className="discovery-eyebrow">
            LIBRARY
          </span>

          <h1>
            Watch history
          </h1>

          <p>
            Videos you recently
            watched and your current
            playback progress.
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
                  ? 'Resume history'
                  : 'Pause history'}
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
                Clear history
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
                placeholder="Search watch history"
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
              {items.length}{' '}
              {items.length === 1
                ? 'video'
                : 'videos'}
            </span>
          </div>
        )}

      {actionError && (
        <div className="library-inline-error">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            Loading history...
          </span>
        </div>
      ) : isError ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            History failed to load
          </strong>

          <span>
            Make sure the backend is
            running and try again.
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
      ) : items.length === 0 ? (
        <div className="discovery-state">
          <strong>
            Your history is empty
          </strong>

          <span>
            Start watching videos and
            they will appear here.
          </span>
        </div>
      ) : filteredItems.length ===
        0 ? (
        <div className="discovery-state">
          <strong>
            Nothing found
          </strong>

          <span>
            No history items match
            “{query}”.
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
                      {item.video.title}
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

                      <span>
                        {formatWatchedDate(
                          item.lastWatchedAt,
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
                    Remove
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
              WATCH HISTORY
            </span>

            <h2 id="history-clear-title">
              Clear watch history?
            </h2>

            <p id="history-clear-description">
              All watched videos and
              saved playback progress
              will be removed from your
              history. This action
              cannot be undone.
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
                Cancel
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
                  ? 'Clearing...'
                  : 'Clear history'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
