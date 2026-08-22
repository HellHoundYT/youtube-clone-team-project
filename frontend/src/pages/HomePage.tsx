import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getVideos,
  type VideoListItem,
} from '../api/videos'

interface HeroSlide {
  id: number
  label: string
  title: string
  description: string
  accent: string
}

interface CategoryLoadState {
  category: string
  videos: VideoListItem[]
  error: boolean
}

const categories = [
  'All',
  'Music',
  'Games',
  'Cybersport',
  'Education',
  'Films',
  'Podcasts',
  'Mixes',
]

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    label: 'AMTLIS ORIGINAL',
    title: 'Discover a new world of video',
    description:
      'Watch stories, streams, music and creators you love. Discover something new every day.',
    accent: 'purple',
  },
  {
    id: 2,
    label: 'LIVE NOW',
    title: 'The biggest moments are happening now',
    description:
      'Watch creators, tournaments and live events together with the AMTLIS community.',
    accent: 'blue',
  },
  {
    id: 3,
    label: 'TRENDING',
    title: 'Find what everyone is watching',
    description:
      'Explore popular videos, new releases and creators that are growing right now.',
    accent: 'pink',
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
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 7 8 5-8 5Z" />
    </svg>
  )
}

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ArrowIcon({
  direction,
}: {
  direction: 'left' | 'right'
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

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(
    0,
    Math.floor(seconds),
  )

  const hours = Math.floor(
    safeSeconds / 3600,
  )

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
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

function formatViews(value: number) {
  const formatted =
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)

  return `${formatted} views`
}

function formatDate(
  publishedAt: string | null,
) {
  if (!publishedAt) {
    return 'Not published'
  }

  const date = new Date(publishedAt)

  return new Intl.DateTimeFormat(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  ).format(date)
}

function getVideoTone(
  video: VideoListItem,
  index: number,
) {
  const categoryIndex =
    categories.indexOf(
      video.category ?? '',
    )

  if (categoryIndex > 0) {
    return tones[
      (categoryIndex - 1) %
        tones.length
    ]
  }

  return tones[
    index % tones.length
  ]
}

function VideoCardItem({
  video,
  index,
  onOpen,
}: {
  video: VideoListItem
  index: number
  onOpen: (videoId: string) => void
}) {
  const tone = getVideoTone(
    video,
    index,
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
            src={video.thumbnailPath}
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
            {formatViews(
              video.viewCount,
            )}{' '}
            ·{' '}
            {formatDate(
              video.publishedAt,
            )}
          </span>
        </div>
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
  return (
    <div className="content-section-header">
      <h2>
        {title}
      </h2>

      <div className="section-controls">
        <button
          type="button"
          className="section-arrow"
          aria-label={`Previous ${title}`}
          onClick={onPrevious}
        >
          <ArrowIcon direction="left" />
        </button>

        <button
          type="button"
          className="section-arrow"
          aria-label={`Next ${title}`}
          onClick={onNext}
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
    </div>
  )
}

function HomeLoadingState() {
  return (
    <div className="home-api-state">
      <div className="watch-loading-spinner" />

      <span>
        Loading videos...
      </span>
    </div>
  )
}

function HomeErrorState({
  onRetry,
}: {
  onRetry: () => void
}) {
  return (
    <div className="home-api-state home-api-error">
      <strong>
        Videos could not be loaded.
      </strong>

      <span>
        Check that the API is running
        and try again.
      </span>

      <button
        type="button"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  )
}

function HomeEmptyState() {
  return (
    <div className="home-api-state">
      <strong>
        No videos found.
      </strong>

      <span>
        There are no videos in this
        category yet.
      </span>
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()

  const [
    activeCategory,
    setActiveCategory,
  ] = useState('All')

  const [
    activeHero,
    setActiveHero,
  ] = useState(0)

  const [
    reloadToken,
    setReloadToken,
  ] = useState(0)

  const [
    allVideosState,
    setAllVideosState,
  ] = useState<{
    token: number
    videos: VideoListItem[]
    error: boolean
  } | null>(null)

  const [
    categoryState,
    setCategoryState,
  ] =
    useState<CategoryLoadState | null>(
      null,
    )

  const topRef =
    useRef<HTMLDivElement>(null)

  const popularRef =
    useRef<HTMLDivElement>(null)

  const allVideoRef =
    useRef<HTMLDivElement>(null)

  const selectedHero =
    heroSlides[activeHero]

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
      .then((videos) => {
        if (
          controller.signal.aborted
        ) {
          return
        }

        setAllVideosState({
          token: reloadToken,
          videos,
          error: false,
        })
      })
      .catch(() => {
        if (
          controller.signal.aborted
        ) {
          return
        }

        setAllVideosState({
          token: reloadToken,
          videos: [],
          error: true,
        })
      })

    return () => {
      controller.abort()
    }
  }, [reloadToken])

  useEffect(() => {
    if (
      activeCategory === 'All'
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
      .then((videos) => {
        if (
          controller.signal.aborted
        ) {
          return
        }

        setCategoryState({
          category:
            activeCategory,
          videos,
          error: false,
        })
      })
      .catch(() => {
        if (
          controller.signal.aborted
        ) {
          return
        }

        setCategoryState({
          category:
            activeCategory,
          videos: [],
          error: true,
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
        allVideosState?.token !==
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

  const isAllLoading =
    allVideosState?.token !==
    reloadToken

  const isAllError =
    allVideosState?.token ===
      reloadToken &&
    allVideosState.error

  const isCategoryLoading =
    activeCategory !== 'All' &&
    categoryState?.category !==
      activeCategory

  const isCategoryError =
    activeCategory !== 'All' &&
    categoryState?.category ===
      activeCategory &&
    categoryState.error

  const filteredVideos =
    useMemo(() => {
      if (
        activeCategory === 'All'
      ) {
        return allVideos
      }

      if (
        categoryState?.category !==
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
    useMemo(() => {
      return [
        ...filteredVideos,
      ].sort(
        (left, right) =>
          right.viewCount -
          left.viewCount,
      )
    }, [filteredVideos])

  const topVideos =
    useMemo(() => {
      return [
        ...allVideos,
      ]
        .sort(
          (left, right) =>
            right.viewCount -
            left.viewCount,
        )
        .slice(0, 10)
    }, [allVideos])

  const scrollRow = (
    ref:
      RefObject<HTMLDivElement | null>,
    direction:
      'left' | 'right',
  ) => {
    const element = ref.current

    if (!element) {
      return
    }

    element.scrollBy({
      left:
        direction === 'right'
          ? element.clientWidth *
            0.72
          : element.clientWidth *
            -0.72,
      behavior: 'smooth',
    })
  }

  const openVideo = (
    videoId: string,
  ) => {
    navigate(
      `/watch/${videoId}`,
    )
  }

  const openHeroVideo = () => {
    if (
      allVideos.length === 0
    ) {
      return
    }

    const video =
      allVideos[
        activeHero %
          allVideos.length
      ]

    openVideo(video.id)
  }

  const retry = () => {
    setReloadToken(
      (current) =>
        current + 1,
    )
  }

  return (
    <div className="amtlis-home">
      <div className="category-strip">
        {categories.map(
          (category) => (
            <button
              key={category}
              type="button"
              className={`category-chip ${
                activeCategory ===
                category
                  ? 'is-active'
                  : ''
              }`}
              onClick={() =>
                setActiveCategory(
                  category,
                )
              }
            >
              {category}
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

        <div className="hero-content">
          <span className="hero-label">
            {selectedHero.label}
          </span>

          <h1>
            {selectedHero.title}
          </h1>

          <p>
            {selectedHero.description}
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
                Watch now
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
                My list
              </span>
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card hero-card-back">
            <span>
              02
            </span>
          </div>

          <div className="hero-card hero-card-middle">
            <span>
              01
            </span>
          </div>

          <div className="hero-card hero-card-main">
            <div className="hero-card-logo">
              A
            </div>

            <div>
              <span>
                {selectedHero.label}
              </span>

              <strong>
                AMTLIS
              </strong>
            </div>
          </div>
        </div>

        <div className="hero-pagination">
          {heroSlides.map(
            (slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={
                  activeHero === index
                    ? 'is-active'
                    : ''
                }
                aria-label={`Open hero slide ${
                  index + 1
                }`}
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
          title="Top 10"
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
            onRetry={retry}
          />
        ) : topVideos.length ===
          0 ? (
          <HomeEmptyState />
        ) : (
          <div
            className="top-ten-row horizontal-row"
            ref={topRef}
          >
            {topVideos.map(
              (video, index) => (
                <button
                  type="button"
                  className="top-card"
                  key={video.id}
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
                    <div className="thumbnail-glow" />

                    <span className="top-card-title">
                      {video.title}
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
          title="Continue Watching"
          onPrevious={() => {}}
          onNext={() => {}}
        />

        <div className="home-api-state home-history-state">
          <strong>
            Your watch progress
            will appear here.
          </strong>

          <span>
            Continue Watching will
            be connected to Watch
            History instead of using
            fake progress values.
          </span>
        </div>
      </section>

      <section className="home-section">
        <SectionHeader
          title={
            activeCategory ===
            'All'
              ? 'Popular'
              : `Popular in ${activeCategory}`
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
        (activeCategory ===
          'All' &&
          isAllLoading) ? (
          <HomeLoadingState />
        ) : isCategoryError ||
          (activeCategory ===
            'All' &&
            isAllError) ? (
          <HomeErrorState
            onRetry={retry}
          />
        ) : popularVideos.length ===
          0 ? (
          <HomeEmptyState />
        ) : (
          <div
            className="video-horizontal-row horizontal-row"
            ref={popularRef}
          >
            {popularVideos.map(
              (video, index) => (
                <VideoCardItem
                  key={video.id}
                  video={video}
                  index={index}
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
          title="All Video"
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
            onRetry={retry}
          />
        ) : allVideos.length ===
          0 ? (
          <HomeEmptyState />
        ) : (
          <div
            className="video-horizontal-row horizontal-row"
            ref={allVideoRef}
          >
            {allVideos.map(
              (video, index) => (
                <VideoCardItem
                  key={video.id}
                  video={video}
                  index={index}
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