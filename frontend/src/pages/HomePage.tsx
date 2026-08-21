import {
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useNavigate } from 'react-router-dom'

interface VideoCard {
  id: number
  title: string
  channel: string
  views: string
  date: string
  duration: string
  tone: string
  category: string
  progress?: number
}

interface HeroSlide {
  id: number
  label: string
  title: string
  description: string
  accent: string
  videoId: number
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
    videoId: 1,
  },
  {
    id: 2,
    label: 'LIVE NOW',
    title: 'The biggest moments are happening now',
    description:
      'Watch creators, tournaments and live events together with the AMTLIS community.',
    accent: 'blue',
    videoId: 2,
  },
  {
    id: 3,
    label: 'TRENDING',
    title: 'Find what everyone is watching',
    description:
      'Explore popular videos, new releases and creators that are growing right now.',
    accent: 'pink',
    videoId: 4,
  },
]

const videos: VideoCard[] = [
  {
    id: 1,
    title: 'Midnight City',
    channel: 'AMTLIS Music',
    views: '2.4M views',
    date: '2 weeks ago',
    duration: '12:48',
    tone: 'purple',
    category: 'Music',
    progress: 32,
  },
  {
    id: 2,
    title: 'Cyber Arena Finals',
    channel: 'Arena Live',
    views: '842K views',
    date: '4 days ago',
    duration: '28:16',
    tone: 'blue',
    category: 'Cybersport',
    progress: 46,
  },
  {
    id: 3,
    title: 'Beyond The Horizon',
    channel: 'Movie Space',
    views: '1.7M views',
    date: '1 month ago',
    duration: '18:42',
    tone: 'orange',
    category: 'Films',
    progress: 59,
  },
  {
    id: 4,
    title: 'Night Drive Mix',
    channel: 'Deep Waves',
    views: '956K views',
    date: '6 days ago',
    duration: '45:02',
    tone: 'pink',
    category: 'Mixes',
    progress: 74,
  },
  {
    id: 5,
    title: 'Inside The Game',
    channel: 'Play Zone',
    views: '634K views',
    date: '3 days ago',
    duration: '21:10',
    tone: 'green',
    category: 'Games',
    progress: 21,
  },
  {
    id: 6,
    title: 'Future Technology',
    channel: 'Next Level',
    views: '1.1M views',
    date: '1 week ago',
    duration: '15:36',
    tone: 'cyan',
    category: 'Education',
  },
  {
    id: 7,
    title: 'Sound Of Tomorrow',
    channel: 'Wave Records',
    views: '764K views',
    date: '5 days ago',
    duration: '33:14',
    tone: 'purple',
    category: 'Music',
  },
  {
    id: 8,
    title: 'The Last Match',
    channel: 'Competitive Hub',
    views: '1.3M views',
    date: '8 days ago',
    duration: '24:51',
    tone: 'blue',
    category: 'Cybersport',
  },
  {
    id: 9,
    title: 'Learn React',
    channel: 'Code Academy',
    views: '438K views',
    date: '2 days ago',
    duration: '38:25',
    tone: 'green',
    category: 'Education',
  },
  {
    id: 10,
    title: 'Stories After Midnight',
    channel: 'Night Podcast',
    views: '512K views',
    date: '1 week ago',
    duration: '54:08',
    tone: 'pink',
    category: 'Podcasts',
  },
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

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={direction === 'left' ? 'is-left' : ''}
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}

function VideoCardItem({
  video,
  onOpen,
}: {
  video: VideoCard
  onOpen: (videoId: number) => void
}) {
  return (
    <button
      type="button"
      className="video-card"
      onClick={() => onOpen(video.id)}
    >
      <div className={`video-thumbnail tone-${video.tone}`}>
        <div className="thumbnail-glow" />
        <div className="thumbnail-mark">A</div>

        <span className="video-duration">{video.duration}</span>
      </div>

      <div className="video-card-info">
        <div className="channel-avatar">
          {video.channel.charAt(0)}
        </div>

        <div className="video-card-copy">
          <h3>{video.title}</h3>
          <p>{video.channel}</p>

          <span>
            {video.views} · {video.date}
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
      <h2>{title}</h2>

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

function HomePage() {
  const navigate = useNavigate()

  const [activeCategory, setActiveCategory] = useState('All')
  const [activeHero, setActiveHero] = useState(0)

  const topRef = useRef<HTMLDivElement>(null)
  const continueRef = useRef<HTMLDivElement>(null)
  const popularRef = useRef<HTMLDivElement>(null)
  const allVideoRef = useRef<HTMLDivElement>(null)

  const selectedHero = heroSlides[activeHero]

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'All') {
      return videos
    }

    return videos.filter(
      (video) => video.category === activeCategory,
    )
  }, [activeCategory])

  const popularVideos =
    filteredVideos.length > 0 ? filteredVideos : videos

  const scrollRow = (
    ref: RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right',
  ) => {
    const element = ref.current

    if (!element) {
      return
    }

    element.scrollBy({
      left:
        direction === 'right'
          ? element.clientWidth * 0.72
          : element.clientWidth * -0.72,
      behavior: 'smooth',
    })
  }

  const openVideo = (videoId: number) => {
    navigate(`/watch/${videoId}`)
  }

  return (
    <div className="amtlis-home">
      <div className="category-strip">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`category-chip ${
              activeCategory === category ? 'is-active' : ''
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
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

          <h1>{selectedHero.title}</h1>

          <p>{selectedHero.description}</p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-primary-button"
              onClick={() => openVideo(selectedHero.videoId)}
            >
              <PlayIcon />
              <span>Watch now</span>
            </button>

            <button
              type="button"
              className="hero-secondary-button"
              onClick={() => navigate('/playlists')}
            >
              <AddIcon />
              <span>My list</span>
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card hero-card-back">
            <span>02</span>
          </div>

          <div className="hero-card hero-card-middle">
            <span>01</span>
          </div>

          <div className="hero-card hero-card-main">
            <div className="hero-card-logo">A</div>

            <div>
              <span>{selectedHero.label}</span>
              <strong>AMTLIS</strong>
            </div>
          </div>
        </div>

        <div className="hero-pagination">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={activeHero === index ? 'is-active' : ''}
              aria-label={`Open hero slide ${index + 1}`}
              onClick={() => setActiveHero(index)}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader
          title="Top 10"
          onPrevious={() => scrollRow(topRef, 'left')}
          onNext={() => scrollRow(topRef, 'right')}
        />

        <div className="top-ten-row horizontal-row" ref={topRef}>
          {videos.map((video) => (
            <button
              type="button"
              className="top-card"
              key={video.id}
              onClick={() => openVideo(video.id)}
            >
              <div className={`top-thumbnail tone-${video.tone}`}>
                <div className="thumbnail-glow" />

                <span className="top-card-title">
                  {video.title}
                </span>

                <span className="video-duration">
                  {video.duration}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader
          title="Continue Watching"
          onPrevious={() => scrollRow(continueRef, 'left')}
          onNext={() => scrollRow(continueRef, 'right')}
        />

        <div
          className="continue-row horizontal-row"
          ref={continueRef}
        >
          {videos
            .filter((video) => video.progress !== undefined)
            .map((video) => (
              <button
                type="button"
                className="continue-card"
                key={video.id}
                onClick={() => openVideo(video.id)}
              >
                <div
                  className={`continue-thumbnail tone-${video.tone}`}
                >
                  <div className="thumbnail-glow" />

                  <span className="video-duration">
                    {video.duration}
                  </span>

                  <div className="watch-progress">
                    <span
                      style={{
                        width: `${video.progress ?? 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="continue-copy">
                  <h3>{video.title}</h3>
                  <p>{video.channel}</p>
                </div>
              </button>
            ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader
          title={
            activeCategory === 'All'
              ? 'Popular'
              : `Popular in ${activeCategory}`
          }
          onPrevious={() => scrollRow(popularRef, 'left')}
          onNext={() => scrollRow(popularRef, 'right')}
        />

        <div
          className="video-horizontal-row horizontal-row"
          ref={popularRef}
        >
          {popularVideos.map((video) => (
            <VideoCardItem
              key={video.id}
              video={video}
              onOpen={openVideo}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <SectionHeader
          title="All Video"
          onPrevious={() => scrollRow(allVideoRef, 'left')}
          onNext={() => scrollRow(allVideoRef, 'right')}
        />

        <div
          className="video-horizontal-row horizontal-row"
          ref={allVideoRef}
        >
          {[...videos].reverse().map((video) => (
            <VideoCardItem
              key={video.id}
              video={video}
              onOpen={openVideo}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage