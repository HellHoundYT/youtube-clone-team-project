import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getLiveStreams,
  getStreamCategories,
  type LiveStreamListItem,
  type StreamCategory,
} from '../api/streams'
import './StreamsPages.css'

function formatViewerCount(
  viewerCount: number,
) {
  return new Intl.NumberFormat(
    'en-US',
    {
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  ).format(viewerCount)
}

function formatStartedAt(
  startedAt: string,
) {
  const started =
    new Date(startedAt)

  const elapsed =
    Math.max(
      Date.now() -
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
    return `${hours}h ${minutes}m live`
  }

  return `${minutes}m live`
}

function StreamsPage() {
  const navigate =
    useNavigate()

  const [
    streams,
    setStreams,
  ] = useState<
    LiveStreamListItem[]
  >([])

  const [
    categories,
    setCategories,
  ] = useState<
    StreamCategory[]
  >([])

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('all')

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    const controller =
      new AbortController()

    const loadCategories =
      async () => {
        try {
          const data =
            await getStreamCategories(
              controller.signal,
            )

          setCategories(data)
        } catch (requestError) {
          if (
            controller.signal.aborted
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
  }, [])

  useEffect(() => {
    const controller =
      new AbortController()

    const loadStreams =
      async () => {
        try {
          setIsLoading(true)
          setError(null)

          const data =
            await getLiveStreams(
              selectedCategory,
              controller.signal,
            )

          setStreams(data)
        } catch (requestError) {
          if (
            controller.signal.aborted
          ) {
            return
          }

          console.error(
            requestError,
          )

          setError(
            'Live streams could not be loaded.',
          )
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setIsLoading(false)
          }
        }
      }

    void loadStreams()

    return () => {
      controller.abort()
    }
  }, [selectedCategory])

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
      [streams],
    )

  return (
    <section className="streams-page">
      <header className="streams-heading">
        <div>
          <span className="streams-eyebrow">
            LIVE NOW
          </span>

          <h1>
            Streams
          </h1>

          <p>
            Watch active broadcasts,
            discover live categories and
            join the conversation.
          </p>
        </div>

        <div className="streams-summary">
          <div>
            <strong>
              {streams.length}
            </strong>

            <span>
              live streams
            </span>
          </div>

          <div>
            <strong>
              {formatViewerCount(
                totalViewers,
              )}
            </strong>

            <span>
              viewers
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
          All
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
              {category.name}

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
            Loading live streams...
          </strong>

          <span>
            Getting active broadcasts.
          </span>
        </div>
      )}

      {!isLoading &&
        error && (
          <div className="streams-state streams-state-error">
            <strong>
              Could not load streams
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}

      {!isLoading &&
        !error &&
        streams.length === 0 && (
          <div className="streams-state">
            <strong>
              No live streams
            </strong>

            <span>
              There are no active
              broadcasts in this
              category right now.
            </span>
          </div>
        )}

      {!isLoading &&
        !error &&
        streams.length > 0 && (
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
                          LIVE
                        </strong>
                      </div>
                    )}

                    <span className="stream-live-badge">
                      LIVE
                    </span>

                    <span className="stream-viewer-badge">
                      {formatViewerCount(
                        stream.viewerCount,
                      )}{' '}
                      watching
                    </span>
                  </div>

                  <div className="stream-card-body">
                    <div className="stream-channel-avatar">
                      {stream.channelName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="stream-card-copy">
                      <h2>
                        {stream.title}
                      </h2>

                      <span>
                        {
                          stream.channelName
                        }
                      </span>

                      <div className="stream-card-meta">
                        <span>
                          {
                            stream.category
                          }
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