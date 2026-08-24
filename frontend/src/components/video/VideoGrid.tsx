import {
  useNavigate,
} from 'react-router-dom'
import type {
  VideoListItem,
} from '../../api/videos'
import {
  useAppTranslation,
} from '../../shared/i18n'

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

function formatViews(
  value: number,
  locale: string,
) {
  return new Intl.NumberFormat(
    locale,
    {
      notation:
        'compact',

      maximumFractionDigits:
        1,
    },
  ).format(
    value,
  )
}

function formatDate(
  value:
    | string
    | null,
  locale: string,
  fallback: string,
) {
  if (!value) {
    return fallback
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
      value,
    ),
  )
}

function getTone(
  video: VideoListItem,
  index: number,
) {
  if (
    !video.categorySlug
  ) {
    return tones[
      index %
        tones.length
    ]
  }

  const hash =
    [
      ...video.categorySlug,
    ].reduce(
      (
        result,
        character,
      ) =>
        result +
        character.charCodeAt(
          0,
        ),
      0,
    )

  return tones[
    hash %
      tones.length
  ]
}

function VideoGrid({
  videos,
}: VideoGridProps) {
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

  return (
    <div className="discovery-video-grid">
      {videos.map(
        (
          video,
          index,
        ) => {
          const tone =
            getTone(
              video,
              index,
            )

          const formattedViews =
            formatViews(
              video.viewCount,
              locale,
            )

          return (
            <button
              key={
                video.id
              }
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
                    {
                      video.channelName
                    }
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
        },
      )}
    </div>
  )
}

export default VideoGrid
