import {
  useEffect,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import {
  getFavorites,
  removeFavorite,
  type FavoriteItem,
} from '../api/library'
import './DiscoveryPage.css'
import './LibraryPages.css'

interface FavoritesState {
  requestKey: string
  items: FavoriteItem[]
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

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  ).format(
    new Date(value),
  )
}

function FavoritesPage() {
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
    useState<FavoritesState | null>(
      null,
    )

  const [
    actionPendingId,
    setActionPendingId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    actionError,
    setActionError,
  ] =
    useState<string | null>(
      null,
    )

  const requestKey =
    `favorites:${reloadToken}`

  useEffect(() => {
    const controller =
      new AbortController()

    void getFavorites(
      controller.signal,
    )
      .then((items) => {
        if (
          controller.signal
            .aborted
        ) {
          return
        }

        setState({
          requestKey,
          items,
          error: false,
        })
      })
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

  const items =
    isCurrentRequest &&
    !state?.error
      ? state?.items ?? []
      : []

  const handleRemove =
    async (
      videoId: string,
    ) => {
      if (actionPendingId) {
        return
      }

      try {
        setActionError(null)
        setActionPendingId(
          videoId,
        )

        await removeFavorite(
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
          'Favorite could not be removed.',
        )
      } finally {
        setActionPendingId(
          null,
        )
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
            Favorites
          </h1>

          <p>
            Videos you saved to your
            personal favorites.
          </p>
        </div>

        {!isLoading &&
          !isError && (
            <span className="library-count">
              {items.length}{' '}
              {items.length === 1
                ? 'video'
                : 'videos'}
            </span>
          )}
      </header>

      {actionError && (
        <div className="library-inline-error">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            Loading favorites...
          </span>
        </div>
      ) : isError ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            Favorites failed to load
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
            No favorite videos yet
          </strong>

          <span>
            Videos you add to
            Favorites will appear
            here.
          </span>
        </div>
      ) : (
        <div className="library-video-list">
          {items.map(
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
                      {
                        item.video
                          .category ??
                        'Uncategorized'
                      }
                    </span>

                    <span>
                      Saved{' '}
                      {formatDate(
                        item.createdAt,
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="library-remove-button"
                  disabled={
                    actionPendingId ===
                    item.videoId
                  }
                  onClick={() =>
                    void handleRemove(
                      item.videoId,
                    )
                  }
                >
                  {actionPendingId ===
                  item.videoId
                    ? 'Removing...'
                    : 'Remove'}
                </button>
              </article>
            ),
          )}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage