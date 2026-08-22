import { useNavigate } from 'react-router-dom'
import type {
  VideoListItem,
} from '../../api/videos'

interface VideoGridProps {
  videos: VideoListItem[]
}

const tones = [
  'purple',
  'blue',
  'orange',
  'pink',
  'green',
  'cyan',
]

function formatDuration(
  seconds: number,
) {
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

function formatViews(
  value: number,
) {
  return new Intl.NumberFormat(
    'en-US',
    {
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  ).format(value)
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return 'Not published'
  }

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

function getTone(
  video: VideoListItem,
  index: number,
) {
  if (!video.categorySlug) {
    return tones[
      index % tones.length
    ]
  }

  const hash = [
    ...video.categorySlug,
  ].reduce(
    (result, character) =>
      result +
      character.charCodeAt(0),
    0,
  )

  return tones[
    hash % tones.length
  ]
}

function VideoGrid({
  videos,
}: VideoGridProps) {
  const navigate = useNavigate()

  return (
    <div className="discovery-video-grid">
      {videos.map(
        (video, index) => {
          const tone =
            getTone(
              video,
              index,
            )

          return (
            <button
              key={video.id}
              type="button"
              className="video-card"
              onClick={() =>
                navigate(
                  `/watch/${video.id}`,
                )
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
                    {formatViews(
                      video.viewCount,
                    )}{' '}
                    views ·{' '}
                    {formatDate(
                      video.publishedAt,
                    )}
                  </span>
                </div>
              </div>
            </button>
          )
        },
      )}
    </div>
  )
}

export default VideoGrid