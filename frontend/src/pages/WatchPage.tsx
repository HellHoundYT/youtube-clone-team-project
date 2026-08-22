import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getVideoById,
  type VideoDetails,
} from '../api/videos'
import VideoPlayer from '../components/video/VideoPlayer'

interface VideoLoadState {
  videoId: string
  video: VideoDetails | null
  error: string | null
}

function formatViews(viewCount: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(viewCount)
}

function formatPublishedDate(value: string | null) {
  if (!value) {
    return 'Not published'
  }

  const date = new Date(value)

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function WatchPage() {
  const { videoId } = useParams()

  const [loadState, setLoadState] =
    useState<VideoLoadState | null>(null)

  useEffect(() => {
    if (!videoId) {
      return
    }

    const controller = new AbortController()

    void getVideoById(
      videoId,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) {
          return
        }

        setLoadState({
          videoId,
          video: result,
          error: null,
        })
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return
        }

        setLoadState({
          videoId,
          video: null,
          error: 'The video could not be loaded.',
        })
      })

    return () => {
      controller.abort()
    }
  }, [videoId])

  if (!videoId) {
    return (
      <section className="watch-page">
        <div className="watch-state watch-error-state">
          <span className="watch-state-code">
            400
          </span>

          <h1>Video unavailable</h1>

          <p>
            Video identifier is missing.
          </p>

          <Link
            className="watch-back-link"
            to="/"
          >
            Back to Home
          </Link>
        </div>
      </section>
    )
  }

  const isLoading =
    loadState?.videoId !== videoId

  if (isLoading) {
    return (
      <section className="watch-page">
        <div className="watch-state">
          <div className="watch-loading-spinner" />

          <p>Loading video...</p>
        </div>
      </section>
    )
  }

  if (
    loadState.error ||
    !loadState.video
  ) {
    return (
      <section className="watch-page">
        <div className="watch-state watch-error-state">
          <span className="watch-state-code">
            404
          </span>

          <h1>Video unavailable</h1>

          <p>
            {loadState.error ??
              'The requested video does not exist.'}
          </p>

          <Link
            className="watch-back-link"
            to="/"
          >
            Back to Home
          </Link>
        </div>
      </section>
    )
  }

  const video = loadState.video

  const formattedViews =
    formatViews(video.viewCount)

  return (
    <section className="watch-page">
      <div className="watch-main-column">
        <VideoPlayer
          src={video.videoPath}
          title={video.title}
          poster={video.thumbnailPath}
        />

        <div className="watch-video-info">
          <div className="watch-video-heading">
            <div>
              {video.category && (
                <span className="watch-category">
                  {video.category}
                </span>
              )}

              <h1>{video.title}</h1>
            </div>

            <span className="watch-visibility">
              {video.visibility}
            </span>
          </div>

          <div className="watch-video-meta">
            <span>
              {formattedViews} views
            </span>

            <span className="watch-meta-dot" />

            <span>
              {formatPublishedDate(
                video.publishedAt,
              )}
            </span>
          </div>

          <div className="watch-channel-row">
            <div className="watch-channel-identity">
              <div className="watch-channel-avatar">
                {video.channelAvatarPath ? (
                  <img
                    src={video.channelAvatarPath}
                    alt=""
                  />
                ) : (
                  <span>
                    {video.channelName
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="watch-channel-copy">
                <strong>
                  {video.channelName}
                </strong>

                <span>Channel</span>
              </div>
            </div>
          </div>

          {video.description && (
            <div className="watch-description">
              <p>
                {video.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="watch-side-panel">
        <div className="watch-side-card">
          <span className="watch-side-label">
            Up next
          </span>

          <h2>Recommendations</h2>

          <p>
            Recommended videos will be
            connected in the next Video
            module stage.
          </p>
        </div>
      </aside>
    </section>
  )
}

export default WatchPage