import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import {
  getWatchHistory,
  type WatchHistoryItem,
} from '../infrastructure/api/library'
import {
  getVideos,
  type VideoListItem,
} from '../infrastructure/api/videos'
import {
  useAppTranslation,
} from '../shared/i18n'

interface CategoryDefinition {
  value: string
  translationKey: string
}

interface HeroSlide {
  id: number
  label: string
  title: string
  description: string
  accent: string
  image: string
}

interface CategoryLoadState {
  category: string
  videos: VideoListItem[]
  error: boolean
}

interface HistoryLoadState {
  token: number
  items: WatchHistoryItem[]
  error: boolean
}

const categoryDefinitions:
CategoryDefinition[] = [
  {
    value: 'All',
    translationKey:
      'home.categories.all',
  },
  {
    value: 'Music',
    translationKey:
      'home.categories.music',
  },
  {
    value: 'Games',
    translationKey:
      'home.categories.games',
  },
  {
    value: 'Cybersport',
    translationKey:
      'home.categories.cybersport',
  },
  {
    value: 'Education',
    translationKey:
      'home.categories.education',
  },
  {
    value: 'Films',
    translationKey:
      'home.categories.films',
  },
  {
    value: 'Podcasts',
    translationKey:
      'home.categories.podcasts',
  },
  {
    value: 'Mixes',
    translationKey:
      'home.categories.mixes',
  },
]

const tones = [
  'purple',
  'blue',
  'orange',
  'pink',
  'green',
  'cyan',
]

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m9 7 8 5-8 5Z" />
    </svg>
  )
}

function AddIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ArrowIcon({
  direction,
}: {
  direction:
    | 'left'
    | 'right'
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={
        direction === 'left'
          ? 'is-left'
          : ''
      }
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
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

function formatCompactNumber(
  value: number,
  locale: string,
) {
  return new Intl.NumberFormat(
    locale,
    {
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  ).format(value)
}

function formatDate(
  publishedAt:
    | string
    | null,
  locale: string,
  notPublished: string,
) {
  if (!publishedAt) {
    return notPublished
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  ).format(
    new Date(
      publishedAt,
    ),
  )
}

function getVideoTone(
  video: VideoListItem,
  index: number,
) {
  const categoryIndex =
    categoryDefinitions
      .map(
        (category) =>
          category.value,
      )
      .indexOf(
        video.category ??
          '',
      )

  if (
    categoryIndex > 0
  ) {
    return tones[
      (
        categoryIndex -
        1
      ) %
        tones.length
    ]
  }

  return tones[
    index %
      tones.length
  ]
}

function VideoCardItem({
  video,
  index,
  onOpen,
}: {
  video: VideoListItem
  index: number
  onOpen: (
    videoId: string,
  ) => void
}) {
  const {
    t,
    i18n,
  } =
    useAppTranslation()

  const locale =
    getLocale(
      i18n.resolvedLanguage,
    )

  const tone =
    getVideoTone(
      video,
      index,
    )

  const formattedViews =
    formatCompactNumber(
      video.viewCount,
      locale,
    )

  return (
    <button
      type="button"
      className="video-card"
      onClick={() =>
        onOpen(video.id)
      }
    >
      <div
        className={`video-thumbnail tone-${tone}`}
      >
        {video.thumbnailPath ? (
          <img
            className="video-thumbnail-image"
            src={
              video.thumbnailPath
            }
            alt=""
          />
        ) : (
          <>
            <div className="thumbnail-glow" />

            <div className="thumbnail-mark">
              A
            </div>
          </>
        )}

        <span className="video-duration">
          {formatDuration(
            video.durationSeconds,
          )}
        </span>
      </div>

      <div className="video-card-info">
        <div className="channel-avatar">
          {video.channelAvatarPath ? (
            <img
              src={
                video.channelAvatarPath
              }
              alt=""
            />
          ) : (
            video.channelName
              .charAt(0)
              .toUpperCase()
          )}
        </div>

        <div className="video-card-copy">
          <h3>
            {video.title}
          </h3>

          <p>
            {video.channelName}
          </p>

          <span>
            {t(
              'home.views',
              {
                count:
                  video.viewCount,

                formatted:
                  formattedViews,
              },
            )}
            {' · '}
            {formatDate(
              video.publishedAt,
              locale,
              t(
                'home.notPublished',
              ),
            )}
          </span>
        </div>
      </div>
    </button>
  )
}

function ContinueCardItem({
  item,
  index,
  onOpen,
}: {
  item: WatchHistoryItem
  index: number
  onOpen: (
    videoId: string,
  ) => void
}) {
  const video =
    item.video

  const tone =
    getVideoTone(
      video,
      index,
    )

  const duration =
    Math.max(
      1,
      video.durationSeconds,
    )

  const progress =
    Math.min(
      100,
      Math.max(
        0,
        (
          item.progressSeconds /
          duration
        ) * 100,
      ),
    )

  return (
    <button
      type="button"
      className="continue-card"
      onClick={() =>
        onOpen(
          item.videoId,
        )
      }
    >
      <div
        className={`continue-thumbnail video-thumbnail tone-${tone}`}
      >
        {video.thumbnailPath ? (
          <img
            className="video-thumbnail-image"
            src={
              video.thumbnailPath
            }
            alt=""
          />
        ) : (
          <>
            <div className="thumbnail-glow" />

            <div className="thumbnail-mark">
              A
            </div>
          </>
        )}

        <span className="video-duration">
          {formatDuration(
            video.durationSeconds,
          )}
        </span>

        <div className="watch-progress">
          <span
            style={{
              width:
                `${progress}%`,
            }}
          />
        </div>
      </div>

      <div className="continue-copy">
        <h3>
          {video.title}
        </h3>

        <p>
          {video.channelName}
          {' · '}
          {formatDuration(
            item.progressSeconds,
          )}
          {' / '}
          {formatDuration(
            video.durationSeconds,
          )}
        </p>
      </div>
    </button>
  )
}

function SectionHeader({
  title,
  onPrevious,
  onNext,
}: {
  title: string
  onPrevious: () => void
  onNext: () => void
}) {
  const {
    t,
  } =
    useAppTranslation()

  return (
    <div className="content-section-header">
      <h2>
        {title}
      </h2>

      <div className="section-controls">
        <button
          type="button"
          className="section-arrow"
          aria-label={t(
            'home.previousSection',
            {
              title,
            },
          )}
          onClick={
            onPrevious
          }
        >
          <ArrowIcon
            direction="left"
          />
        </button>

        <button
          type="button"
          className="section-arrow"
          aria-label={t(
            'home.nextSection',
            {
              title,
            },
          )}
          onClick={
            onNext
          }
        >
          <ArrowIcon
            direction="right"
          />
        </button>
      </div>
    </div>
  )
}

function HomeLoadingState() {
  const {
    t,
  } =
    useAppTranslation()

  return (
    <div className="home-api-state">
      <div className="watch-loading-spinner" />

      <span>
        {t(
          'home.loadingVideos',
        )}
      </span>
    </div>
  )
}

function HomeErrorState({
  onRetry,
}: {
  onRetry: () => void
}) {
  const {
    t,
  } =
    useAppTranslation()

  return (
    <div className="home-api-state home-api-error">
      <strong>
        {t(
          'home.videosLoadFailed',
        )}
      </strong>

      <span>
        {t(
          'home.apiHint',
        )}
      </span>

      <button
        type="button"
        onClick={
          onRetry
        }
      >
        {t(
          'common.retry',
        )}
      </button>
    </div>
  )
}

function HomeEmptyState() {
  const {
    t,
  } =
    useAppTranslation()

  return (
    <div className="home-api-state">
      <strong>
        {t(
          'home.noVideos',
        )}
      </strong>

      <span>
        {t(
          'home.noVideosCategory',
        )}
      </span>
    </div>
  )
}

function HomePage() {
  const navigate =
    useNavigate()

  const {
    t,
  } =
    useAppTranslation()

  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState('All')

  const [
    activeHero,
    setActiveHero,
  ] =
    useState(0)

  const [
    reloadToken,
    setReloadToken,
  ] =
    useState(0)

  const [
    allVideosState,
    setAllVideosState,
  ] =
    useState<{
      token: number
      videos:
        VideoListItem[]
      error: boolean
    } | null>(
      null,
    )

  const [
    categoryState,
    setCategoryState,
  ] =
    useState<CategoryLoadState | null>(
      null,
    )

  const [
    historyState,
    setHistoryState,
  ] =
    useState<HistoryLoadState | null>(
      null,
    )

  const topRef =
    useRef<HTMLDivElement>(
      null,
    )

  const continueRef =
    useRef<HTMLDivElement>(
      null,
    )

  const popularRef =
    useRef<HTMLDivElement>(
      null,
    )

  const allVideoRef =
    useRef<HTMLDivElement>(
      null,
    )

  const heroSlides:
  HeroSlide[] = [
    {
      id: 1,

      label:
        t(
          'home.hero.original.label',
        ),

      title:
        t(
          'home.hero.original.title',
        ),

      description:
        t(
          'home.hero.original.description',
        ),

      accent:
        'purple',

      image:
        '/demo/hero/hero-original.webp',
    },

    {
      id: 2,

      label:
        t(
          'home.hero.live.label',
        ),

      title:
        t(
          'home.hero.live.title',
        ),

      description:
        t(
          'home.hero.live.description',
        ),

      accent:
        'blue',

      image:
        '/demo/hero/hero-live.webp',
    },

    {
      id: 3,

      label:
        t(
          'home.hero.trending.label',
        ),

      title:
        t(
          'home.hero.trending.title',
        ),

      description:
        t(
          'home.hero.trending.description',
        ),

      accent:
        'pink',

      image:
        '/demo/hero/hero-trending.webp',
    },
  ]

  const selectedHero =
    heroSlides[
      activeHero
    ]

  const getCategoryLabel = (
    value: string,
  ) => {
    const definition =
      categoryDefinitions.find(
        (category) =>
          category.value ===
          value,
      )

    if (!definition) {
      return value
    }

    return t(
      definition.translationKey,
    )
  }

  useEffect(() => {
    const controller =
      new AbortController()

    void getVideos(
      {
        page: 1,
        pageSize: 50,
      },
      controller.signal,
    )
      .then(
        (videos) => {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setAllVideosState({
            token:
              reloadToken,

            videos,

            error:
              false,
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

        setAllVideosState({
          token:
            reloadToken,

          videos: [],

          error:
            true,
        })
      })

    return () => {
      controller.abort()
    }
  }, [
    reloadToken,
  ])

  useEffect(() => {
    const controller =
      new AbortController()

    void getWatchHistory(
      controller.signal,
    )
      .then(
        (items) => {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setHistoryState({
            token:
              reloadToken,

            items,

            error:
              false,
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

        setHistoryState({
          token:
            reloadToken,

          items: [],

          error:
            true,
        })
      })

    return () => {
      controller.abort()
    }
  }, [
    reloadToken,
  ])

  useEffect(() => {
    if (
      activeCategory ===
      'All'
    ) {
      return
    }

    const controller =
      new AbortController()

    void getVideos(
      {
        page: 1,

        pageSize: 50,

        category:
          activeCategory,
      },
      controller.signal,
    )
      .then(
        (videos) => {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setCategoryState({
            category:
              activeCategory,

            videos,

            error:
              false,
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

        setCategoryState({
          category:
            activeCategory,

          videos: [],

          error:
            true,
        })
      })

    return () => {
      controller.abort()
    }
  }, [
    activeCategory,
    reloadToken,
  ])

  const allVideos =
    useMemo(() => {
      if (
        allVideosState
          ?.token !==
          reloadToken ||
        allVideosState.error
      ) {
        return []
      }

      return allVideosState.videos
    }, [
      allVideosState,
      reloadToken,
    ])

  const continueWatching =
    useMemo(() => {
      if (
        historyState
          ?.token !==
          reloadToken ||
        historyState.error
      ) {
        return []
      }

      return historyState.items
        .filter(
          (item) =>
            !item.completed &&
            item.progressSeconds >
              0 &&
            item.video
              .durationSeconds >
              0,
        )
        .sort(
          (
            left,
            right,
          ) =>
            new Date(
              right.lastWatchedAt,
            ).getTime() -
            new Date(
              left.lastWatchedAt,
            ).getTime(),
        )
    }, [
      historyState,
      reloadToken,
    ])

  const isAllLoading =
    allVideosState
      ?.token !==
    reloadToken

  const isAllError =
    allVideosState
      ?.token ===
      reloadToken &&
    allVideosState.error

  const isHistoryLoading =
    historyState
      ?.token !==
    reloadToken

  const isHistoryError =
    historyState
      ?.token ===
      reloadToken &&
    historyState.error

  const isCategoryLoading =
    activeCategory !==
      'All' &&
    categoryState
      ?.category !==
      activeCategory

  const isCategoryError =
    activeCategory !==
      'All' &&
    categoryState
      ?.category ===
      activeCategory &&
    categoryState.error

  const filteredVideos =
    useMemo(() => {
      if (
        activeCategory ===
        'All'
      ) {
        return allVideos
      }

      if (
        categoryState
          ?.category !==
          activeCategory ||
        categoryState.error
      ) {
        return []
      }

      return categoryState.videos
    }, [
      activeCategory,
      allVideos,
      categoryState,
    ])

  const popularVideos =
    useMemo(
      () =>
        [
          ...filteredVideos,
        ].sort(
          (
            left,
            right,
          ) =>
            right.viewCount -
            left.viewCount,
        ),
      [
        filteredVideos,
      ],
    )

  const topVideos =
    useMemo(
      () =>
        [
          ...allVideos,
        ]
          .sort(
            (
              left,
              right,
            ) =>
              right.viewCount -
              left.viewCount,
          )
          .slice(
            0,
            10,
          ),
      [
        allVideos,
      ],
    )

  const scrollRow = (
    ref:
      RefObject<
        HTMLDivElement | null
      >,

    direction:
      | 'left'
      | 'right',
  ) => {
    const element =
      ref.current

    if (!element) {
      return
    }

    element.scrollBy({
      left:
        direction ===
        'right'
          ? element
              .clientWidth *
            0.72
          : element
              .clientWidth *
            -0.72,

      behavior:
        'smooth',
    })
  }

  const openVideo = (
    videoId: string,
  ) => {
    navigate(
      `/watch/${videoId}`,
    )
  }

  const openHeroVideo =
    () => {
      if (
        allVideos.length ===
        0
      ) {
        return
      }

      const video =
        allVideos[
          activeHero %
            allVideos.length
        ]

      openVideo(
        video.id,
      )
    }

  const retry = () => {
    setReloadToken(
      (current) =>
        current + 1,
    )
  }

  const popularTitle =
    activeCategory ===
    'All'
      ? t(
          'home.sections.popular',
        )
      : t(
          'home.sections.popularIn',
          {
            category:
              getCategoryLabel(
                activeCategory,
              ),
          },
        )

  return (
    <div className="amtlis-home">
      <div className="category-strip">
        {categoryDefinitions.map(
          (category) => (
            <button
              key={
                category.value
              }
              type="button"
              className={`category-chip ${
                activeCategory ===
                category.value
                  ? 'is-active'
                  : ''
              }`}
              onClick={() =>
                setActiveCategory(
                  category.value,
                )
              }
            >
              {t(
                category.translationKey,
              )}
            </button>
          ),
        )}
      </div>

      <section
        className={`home-hero hero-accent-${selectedHero.accent}`}
      >
        <div className="hero-background">
          <div className="hero-light hero-light-one" />
          <div className="hero-light hero-light-two" />
          <div className="hero-grid-decoration" />
        </div>

        <img
          src={
            selectedHero.image
          }
          alt=""
          aria-hidden="true"
          style={{
            position:
              'absolute',

            inset: 0,

            zIndex: 2,

            width:
              '100%',

            height:
              '100%',

            objectFit:
              'cover',

            objectPosition:
              'center',

            pointerEvents:
              'none',
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position:
              'absolute',

            inset: 0,

            zIndex: 3,

            background:
              'linear-gradient(90deg, rgba(7, 8, 13, 0.50) 0%, rgba(7, 8, 13, 0.34) 32%, rgba(7, 8, 13, 0.14) 58%, rgba(7, 8, 13, 0.03) 100%)',

            pointerEvents:
              'none',
          }}
        />

        <div
          className="hero-content"
          style={{
            position:
              'relative',

            zIndex: 4,
          }}
        >
          <span className="hero-label">
            {
              selectedHero.label
            }
          </span>

          <h1>
            {
              selectedHero.title
            }
          </h1>

          <p>
            {
              selectedHero.description
            }
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-primary-button"
              disabled={
                allVideos.length ===
                0
              }
              onClick={
                openHeroVideo
              }
            >
              <PlayIcon />

              <span>
                {t(
                  'home.hero.watchNow',
                )}
              </span>
            </button>

            <button
              type="button"
              className="hero-secondary-button"
              onClick={() =>
                navigate(
                  '/playlists',
                )
              }
            >
              <AddIcon />

              <span>
                {t(
                  'home.hero.myList',
                )}
              </span>
            </button>
          </div>
        </div>

        <div
          className="hero-pagination"
          style={{
            zIndex: 5,
          }}
        >
          {heroSlides.map(
            (
              slide,
              index,
            ) => (
              <button
                key={
                  slide.id
                }
                type="button"
                className={
                  activeHero ===
                  index
                    ? 'is-active'
                    : ''
                }
                aria-label={t(
                  'home.hero.openSlide',
                  {
                    number:
                      index +
                      1,
                  },
                )}
                onClick={() =>
                  setActiveHero(
                    index,
                  )
                }
              />
            ),
          )}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader
          title={t(
            'home.sections.top10',
          )}
          onPrevious={() =>
            scrollRow(
              topRef,
              'left',
            )
          }
          onNext={() =>
            scrollRow(
              topRef,
              'right',
            )
          }
        />

        {isAllLoading ? (
          <HomeLoadingState />
        ) : isAllError ? (
          <HomeErrorState
            onRetry={
              retry
            }
          />
        ) : topVideos.length ===
          0 ? (
          <HomeEmptyState />
        ) : (
          <div
            className="top-ten-row horizontal-row"
            ref={
              topRef
            }
          >
            {topVideos.map(
              (
                video,
                index,
              ) => (
                <button
                  type="button"
                  className="top-card"
                  key={
                    video.id
                  }
                  onClick={() =>
                    openVideo(
                      video.id,
                    )
                  }
                >
                  <div
                    className={`top-thumbnail tone-${getVideoTone(
                      video,
                      index,
                    )}`}
                  >
                    {video.thumbnailPath ? (
                      <img
                        className="video-thumbnail-image"
                        src={
                          video.thumbnailPath
                        }
                        alt=""
                      />
                    ) : (
                      <div className="thumbnail-glow" />
                    )}

                    <span className="top-card-title">
                      {
                        video.title
                      }
                    </span>

                    <span className="video-duration">
                      {formatDuration(
                        video.durationSeconds,
                      )}
                    </span>
                  </div>
                </button>
              ),
            )}
          </div>
        )}
      </section>

      <section className="home-section">
        <SectionHeader
          title={t(
            'home.sections.continueWatching',
          )}
          onPrevious={() =>
            scrollRow(
              continueRef,
              'left',
            )
          }
          onNext={() =>
            scrollRow(
              continueRef,
              'right',
            )
          }
        />

        {isHistoryLoading ? (
          <div className="home-api-state">
            <div className="watch-loading-spinner" />

            <span>
              {t(
                'home.loadingHistory',
              )}
            </span>
          </div>
        ) : isHistoryError ? (
          <div className="home-api-state home-api-error">
            <strong>
              {t(
                'home.historyLoadFailed',
              )}
            </strong>

            <span>
              {t(
                'home.apiHint',
              )}
            </span>

            <button
              type="button"
              onClick={
                retry
              }
            >
              {t(
                'common.retry',
              )}
            </button>
          </div>
        ) : continueWatching.length ===
          0 ? (
          <div className="home-api-state home-history-state">
            <strong>
              {t(
                'home.nothingToContinue',
              )}
            </strong>

            <span>
              {t(
                'home.continueHint',
              )}
            </span>
          </div>
        ) : (
          <div
            className="continue-row horizontal-row"
            ref={
              continueRef
            }
          >
            {continueWatching.map(
              (
                item,
                index,
              ) => (
                <ContinueCardItem
                  key={
                    item.videoId
                  }
                  item={
                    item
                  }
                  index={
                    index
                  }
                  onOpen={
                    openVideo
                  }
                />
              ),
            )}
          </div>
        )}
      </section>

      <section className="home-section">
        <SectionHeader
          title={
            popularTitle
          }
          onPrevious={() =>
            scrollRow(
              popularRef,
              'left',
            )
          }
          onNext={() =>
            scrollRow(
              popularRef,
              'right',
            )
          }
        />

        {isCategoryLoading ||
        (
          activeCategory ===
            'All' &&
          isAllLoading
        ) ? (
          <HomeLoadingState />
        ) : isCategoryError ||
          (
            activeCategory ===
              'All' &&
            isAllError
          ) ? (
          <HomeErrorState
            onRetry={
              retry
            }
          />
        ) : popularVideos.length ===
          0 ? (
          <HomeEmptyState />
        ) : (
          <div
            className="video-horizontal-row horizontal-row"
            ref={
              popularRef
            }
          >
            {popularVideos.map(
              (
                video,
                index,
              ) => (
                <VideoCardItem
                  key={
                    video.id
                  }
                  video={
                    video
                  }
                  index={
                    index
                  }
                  onOpen={
                    openVideo
                  }
                />
              ),
            )}
          </div>
        )}
      </section>

      <section className="home-section">
        <SectionHeader
          title={t(
            'home.sections.allVideos',
          )}
          onPrevious={() =>
            scrollRow(
              allVideoRef,
              'left',
            )
          }
          onNext={() =>
            scrollRow(
              allVideoRef,
              'right',
            )
          }
        />

        {isAllLoading ? (
          <HomeLoadingState />
        ) : isAllError ? (
          <HomeErrorState
            onRetry={
              retry
            }
          />
        ) : allVideos.length ===
          0 ? (
          <HomeEmptyState />
        ) : (
          <div
            className="video-horizontal-row horizontal-row"
            ref={
              allVideoRef
            }
          >
            {allVideos.map(
              (
                video,
                index,
              ) => (
                <VideoCardItem
                  key={
                    video.id
                  }
                  video={
                    video
                  }
                  index={
                    index
                  }
                  onOpen={
                    openVideo
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage
