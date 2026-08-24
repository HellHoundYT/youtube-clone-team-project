import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import type {
  StreamService,
} from '../application/stream/service'
import type {
  LiveStreamListItem,
  StreamCategory,
} from '../domain/stream/types'
import {
  useAppTranslation,
} from '../shared/i18n'
import './StreamsPages.css'

const categoryKeys:
Record<string, string> = {
  programming:
    'streamCategory.programming',

  gaming:
    'streamCategory.gaming',

  games:
    'streamCategory.games',

  music:
    'streamCategory.music',

  education:
    'streamCategory.education',

  esports:
    'streamCategory.esports',

  cybersport:
    'streamCategory.cybersport',

  creative:
    'streamCategory.creative',

  technology:
    'streamCategory.technology',

  art:
    'streamCategory.art',

  chatting:
    'streamCategory.chatting',

  'just-chatting':
    'streamCategory.justChatting',
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

function formatViewerCount(
  viewerCount: number,
  locale: string,
) {
  return new Intl.NumberFormat(
    locale,
    {
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  ).format(
    viewerCount,
  )
}

const initialStreamsPageTime =
  Date.now()

interface StreamsPageProps {
  streamService: StreamService
}

function StreamsPage({
  streamService,
}: StreamsPageProps) {
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
    currentTime,
    setCurrentTime,
  ] =
    useState(
      initialStreamsPageTime,
    )

  const [
    streams,
    setStreams,
  ] =
    useState<
      LiveStreamListItem[]
    >([])

  const [
    categories,
    setCategories,
  ] =
    useState<
      StreamCategory[]
    >([])

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState('all')

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    hasError,
    setHasError,
  ] =
    useState(false)

  const getCategoryLabel = (
    slug: string,
    name: string,
  ) => {
    const normalized =
      slug
        .trim()
        .toLowerCase()

    const key =
      categoryKeys[
        normalized
      ]

    return key
      ? t(key)
      : name
  }

  const getStreamCategoryLabel = (
    category: string,
  ) => {
    const normalized =
      category
        .trim()
        .toLowerCase()
        .replace(
          /\s+/g,
          '-',
        )

    const key =
      categoryKeys[
        normalized
      ]

    return key
      ? t(key)
      : category
  }

  const formatStartedAt = (
    startedAt: string,
  ) => {
    const started =
      new Date(
        startedAt,
      )

    const elapsed =
      Math.max(
        currentTime -
          started.getTime(),
        0,
      )

    const totalMinutes =
      Math.floor(
        elapsed / 60000,
      )

    const hours =
      Math.floor(
        totalMinutes / 60,
      )

    const minutes =
      totalMinutes % 60

    if (hours > 0) {
      return t(
        'streams.liveForHours',
        {
          hours,
          minutes,
        },
      )
    }

    return t(
      'streams.liveForMinutes',
      {
        minutes,
      },
    )
  }

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setCurrentTime(
            Date.now(),
          )
        },
        60000,
      )

    return () => {
      window.clearInterval(
        timer,
      )
    }
  }, [
    streamService,
  ])

  useEffect(() => {
    const controller =
      new AbortController()

    const loadCategories =
      async () => {
        try {
          const data =
            await streamService.getStreamCategories(
              controller.signal,
            )

          setCategories(
            data,
          )
        } catch (
          requestError
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          console.error(
            requestError,
          )
        }
      }

    void loadCategories()

    return () => {
      controller.abort()
    }
  }, [
    streamService,
  ])

  useEffect(() => {
    const controller =
      new AbortController()

    const loadStreams =
      async () => {
        try {
          setIsLoading(
            true,
          )

          setHasError(
            false,
          )

          const data =
            await streamService.getLiveStreams(
              selectedCategory,
              controller.signal,
            )

          setStreams(
            data,
          )
        } catch (
          requestError
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          console.error(
            requestError,
          )

          setHasError(
            true,
          )
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setIsLoading(
              false,
            )
          }
        }
      }

    void loadStreams()

    return () => {
      controller.abort()
    }
  }, [
    selectedCategory,
    streamService,
  ])

  const totalViewers =
    useMemo(
      () =>
        streams.reduce(
          (
            total,
            stream,
          ) =>
            total +
            stream.viewerCount,
          0,
        ),
      [
        streams,
      ],
    )

  return (
    <section className="streams-page">
      <header className="streams-heading">
        <div>
          <span className="streams-eyebrow">
            {t(
              'streams.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'streams.title',
            )}
          </h1>

          <p>
            {t(
              'streams.description',
            )}
          </p>
        </div>

        <div className="streams-summary">
          <div>
            <strong>
              {
                streams.length
              }
            </strong>

            <span>
              {t(
                'streams.liveStreams',
                {
                  count:
                    streams.length,
                },
              )}
            </span>
          </div>

          <div>
            <strong>
              {formatViewerCount(
                totalViewers,
                locale,
              )}
            </strong>

            <span>
              {t(
                'streams.viewers',
                {
                  count:
                    totalViewers,
                },
              )}
            </span>
          </div>
        </div>
      </header>

      <div className="streams-category-list">
        <button
          type="button"
          className={
            selectedCategory ===
            'all'
              ? 'streams-category-button active'
              : 'streams-category-button'
          }
          onClick={() =>
            setSelectedCategory(
              'all',
            )
          }
        >
          {t(
            'streams.all',
          )}
        </button>

        {categories.map(
          (category) => (
            <button
              key={
                category.slug
              }
              type="button"
              className={
                selectedCategory ===
                category.slug
                  ? 'streams-category-button active'
                  : 'streams-category-button'
              }
              onClick={() =>
                setSelectedCategory(
                  category.slug,
                )
              }
            >
              {getCategoryLabel(
                category.slug,
                category.name,
              )}

              <span>
                {
                  category.liveStreamCount
                }
              </span>
            </button>
          ),
        )}
      </div>

      {isLoading && (
        <div className="streams-state">
          <strong>
            {t(
              'streams.loading',
            )}
          </strong>

          <span>
            {t(
              'streams.loadingHint',
            )}
          </span>
        </div>
      )}

      {!isLoading &&
        hasError && (
          <div className="streams-state streams-state-error">
            <strong>
              {t(
                'streams.loadFailed',
              )}
            </strong>

            <span>
              {t(
                'streams.loadFailedHint',
              )}
            </span>
          </div>
        )}

      {!isLoading &&
        !hasError &&
        streams.length ===
          0 && (
          <div className="streams-state">
            <strong>
              {t(
                'streams.empty',
              )}
            </strong>

            <span>
              {t(
                'streams.emptyHint',
              )}
            </span>
          </div>
        )}

      {!isLoading &&
        !hasError &&
        streams.length >
          0 && (
          <div className="streams-grid">
            {streams.map(
              (stream) => (
                <article
                  key={
                    stream.id
                  }
                  className="stream-card"
                  onClick={() =>
                    navigate(
                      `/streamers/${stream.id}`,
                    )
                  }
                >
                  <div className="stream-card-preview">
                    {stream.thumbnailPath ? (
                      <img
                        src={
                          stream.thumbnailPath
                        }
                        alt=""
                      />
                    ) : (
                      <div className="stream-card-placeholder">
                        <span>
                          AMTLIS
                        </span>

                        <strong>
                          {t(
                            'streams.live',
                          )}
                        </strong>
                      </div>
                    )}

                    <span className="stream-live-badge">
                      {t(
                        'streams.live',
                      )}
                    </span>

                    <span className="stream-viewer-badge">
                      {t(
                        'streams.watching',
                        {
                          formatted:
                            formatViewerCount(
                              stream.viewerCount,
                              locale,
                            ),
                        },
                      )}
                    </span>
                  </div>

                  <div className="stream-card-body">
                    <div className="stream-channel-avatar">
                      {stream.channelName
                        .charAt(
                          0,
                        )
                        .toUpperCase()}
                    </div>

                    <div className="stream-card-copy">
                      <h2>
                        {
                          stream.title
                        }
                      </h2>

                      <span>
                        {
                          stream.channelName
                        }
                      </span>

                      <div className="stream-card-meta">
                        <span>
                          {getStreamCategoryLabel(
                            stream.category,
                          )}
                        </span>

                        <span>
                          {formatStartedAt(
                            stream.startedAt,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
    </section>
  )
}

export default StreamsPage

