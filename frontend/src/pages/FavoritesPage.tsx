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
import {
  useAppTranslation,
} from '../shared/i18n'
import './DiscoveryPage.css'
import './LibraryPages.css'

interface FavoritesState {
  requestKey: string
  items: FavoriteItem[]
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

function formatDate(
  value: string,
  locale: string,
) {
  return new Intl.DateTimeFormat(
    locale,
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
    actionErrorKey,
    setActionErrorKey,
  ] =
    useState<string | null>(
      null,
    )

  const requestKey =
    `favorites:${reloadToken}`

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
        setActionErrorKey(
          null,
        )
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
        setActionErrorKey(
          'library.favorites.removeFailed',
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
            {t(
              'library.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'library.favorites.title',
            )}
          </h1>

          <p>
            {t(
              'library.favorites.description',
            )}
          </p>
        </div>

        {!isLoading &&
          !isError && (
            <span className="library-count">
              {t(
                'library.video',
                {
                  count:
                    items.length,
                },
              )}
            </span>
          )}
      </header>

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
              'library.favorites.loading',
            )}
          </span>
        </div>
      ) : isError ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            {t(
              'library.favorites.loadFailed',
            )}
          </strong>

          <span>
            {t(
              'library.favorites.backendHint',
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
              'library.favorites.empty',
            )}
          </strong>

          <span>
            {t(
              'library.favorites.emptyHint',
            )}
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
                        'library.favorites.saved',
                        {
                          date:
                            formatDate(
                              item.createdAt,
                              locale,
                            ),
                        },
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
                    ? t(
                        'library.removing',
                      )
                    : t(
                        'library.remove',
                      )}
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
