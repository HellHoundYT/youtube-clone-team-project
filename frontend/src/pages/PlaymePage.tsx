import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import {
  getVideos,
  registerVideoView,
  type VideoListItem,
} from '../api/videos'
import './PlaymePage.css'

const playmePosters = [
  '/demo/playme/epic-clip.webp',
  '/demo/playme/night-vibe.webp',
  '/demo/playme/code-quick.webp',
  '/demo/playme/keep-moving.webp',
] as const

function formatViews(value: number) {
  return new Intl.NumberFormat(
    'en-US',
    {
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  ).format(value)
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 5v14M16 5v14" />
    </svg>
  )
}

function VolumeIcon({
  muted,
}: {
  muted: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 9v6h4l5 4V5L9 9H5z" />

      {muted ? (
        <>
          <path d="M18 9l4 6" />
          <path d="M22 9l-4 6" />
        </>
      ) : (
        <>
          <path d="M17 9.5a4 4 0 0 1 0 5" />
          <path d="M19.5 7a7 7 0 0 1 0 10" />
        </>
      )}
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="5"
        r="3"
      />

      <circle
        cx="6"
        cy="12"
        r="3"
      />

      <circle
        cx="18"
        cy="19"
        r="3"
      />

      <path d="M8.6 10.5l6.8-4" />
      <path d="M8.6 13.5l6.8 4" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function PlaymePage() {
  const [
    videos,
    setVideos,
  ] = useState<
    VideoListItem[]
  >([])

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0)

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

  const [
    isMuted,
    setIsMuted,
  ] = useState(true)

  const [
    isPaused,
    setIsPaused,
  ] = useState(false)

  const [
    likedVideoIds,
    setLikedVideoIds,
  ] = useState<
    Set<string>
  >(
    () =>
      new Set<string>(),
  )

  const [
    failedVideoIds,
    setFailedVideoIds,
  ] = useState<
    Set<string>
  >(
    () =>
      new Set<string>(),
  )

  const [
    actionNotice,
    setActionNotice,
  ] = useState<
    string | null
  >(null)

  const feedRef =
    useRef<
      HTMLDivElement | null
    >(null)

  const videoRefs =
    useRef<
      Array<
        HTMLVideoElement | null
      >
    >([])

  const wheelLockedRef =
    useRef(false)

  const viewedVideoIdsRef =
    useRef(
      new Set<string>(),
    )

  useEffect(() => {
    const controller =
      new AbortController()

    const loadVideos =
      async () => {
        try {
          setIsLoading(true)
          setError(null)

          const data =
            await getVideos(
              {
                page: 1,
                pageSize: 12,
              },
              controller.signal,
            )

          if (
            controller.signal.aborted
          ) {
            return
          }

          setVideos(data)
        } catch (
          requestError
        ) {
          if (
            controller.signal.aborted
          ) {
            return
          }

          console.error(
            requestError,
          )

          setError(
            'Playme videos could not be loaded.',
          )
        } finally {
          if (
            !controller.signal.aborted
          ) {
            setIsLoading(false)
          }
        }
      }

    void loadVideos()

    return () => {
      controller.abort()
    }
  }, [])

  const goToIndex =
    useCallback(
      (
        nextIndex: number,
      ) => {
        if (
          videos.length === 0
        ) {
          return
        }

        const boundedIndex =
          Math.max(
            0,
            Math.min(
              nextIndex,
              videos.length - 1,
            ),
          )

        const feed =
          feedRef.current

        setActiveIndex(
          boundedIndex,
        )

        setIsPaused(false)
        setActionNotice(null)

        if (!feed) {
          return
        }

        feed.scrollTo({
          top:
            boundedIndex *
            feed.clientHeight,
          behavior: 'smooth',
        })
      },
      [videos.length],
    )

  useEffect(() => {
    const handleKeyDown =
      (
        event:
          KeyboardEvent,
      ) => {
        const target =
          event.target

        if (
          target instanceof
            HTMLInputElement ||
          target instanceof
            HTMLTextAreaElement
        ) {
          return
        }

        if (
          event.key ===
            'ArrowDown' ||
          event.key ===
            'PageDown'
        ) {
          event.preventDefault()

          goToIndex(
            activeIndex + 1,
          )
        }

        if (
          event.key ===
            'ArrowUp' ||
          event.key ===
            'PageUp'
        ) {
          event.preventDefault()

          goToIndex(
            activeIndex - 1,
          )
        }

        if (
          event.code ===
          'Space'
        ) {
          event.preventDefault()

          setIsPaused(
            (current) =>
              !current,
          )
        }

        if (
          event.key.toLowerCase() ===
          'm'
        ) {
          setIsMuted(
            (current) =>
              !current,
          )
        }
      }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    activeIndex,
    goToIndex,
  ])

  useEffect(() => {
    videoRefs.current.forEach(
      (
        video,
        index,
      ) => {
        if (!video) {
          return
        }

        video.muted =
          isMuted

        if (
          index ===
            activeIndex &&
          !isPaused
        ) {
          void video
            .play()
            .catch(() => {
              // Browser autoplay can
              // temporarily be blocked.
            })

          return
        }

        video.pause()
      },
    )
  }, [
    activeIndex,
    isMuted,
    isPaused,
    videos.length,
  ])

  useEffect(() => {
    const activeVideo =
      videos[
        activeIndex
      ]

    if (
      !activeVideo ||
      viewedVideoIdsRef
        .current
        .has(
          activeVideo.id,
        )
    ) {
      return
    }

    const timeoutId =
      window.setTimeout(
        () => {
          viewedVideoIdsRef
            .current
            .add(
              activeVideo.id,
            )

          void registerVideoView(
            activeVideo.id,
          ).catch(
            (
              requestError,
            ) => {
              console.error(
                requestError,
              )
            },
          )
        },
        2000,
      )

    return () => {
      window.clearTimeout(
        timeoutId,
      )
    }
  }, [
    activeIndex,
    videos,
  ])

  const handleScroll =
    () => {
      const feed =
        feedRef.current

      if (
        !feed ||
        feed.clientHeight ===
          0 ||
        videos.length === 0
      ) {
        return
      }

      const nextIndex =
        Math.max(
          0,
          Math.min(
            Math.round(
              feed.scrollTop /
                feed.clientHeight,
            ),
            videos.length - 1,
          ),
        )

      if (
        nextIndex ===
        activeIndex
      ) {
        return
      }

      setActiveIndex(
        nextIndex,
      )

      setIsPaused(false)
      setActionNotice(null)
    }

  const handleWheel =
    (
      event:
        ReactWheelEvent<HTMLDivElement>,
    ) => {
      if (
        Math.abs(
          event.deltaY,
        ) < 20 ||
        wheelLockedRef.current
      ) {
        return
      }

      event.preventDefault()

      wheelLockedRef.current =
        true

      const direction =
        event.deltaY > 0
          ? 1
          : -1

      goToIndex(
        activeIndex +
          direction,
      )

      window.setTimeout(
        () => {
          wheelLockedRef.current =
            false
        },
        420,
      )
    }

  const toggleLike =
    () => {
      const activeVideo =
        videos[
          activeIndex
        ]

      setLikedVideoIds(
        (
          current,
        ) => {
          const next =
            new Set(
              current,
            )

          if (
            next.has(
              activeVideo.id,
            )
          ) {
            next.delete(
              activeVideo.id,
            )
          } else {
            next.add(
              activeVideo.id,
            )
          }

          return next
        },
      )

      setActionNotice(
        'Reaction preview only. Account reactions will connect later.',
      )
    }

  const handleComments =
    () => {
      setActionNotice(
        'Comments will connect with the Comments module.',
      )
    }

  const handleShare =
    async () => {
      const activeVideo =
        videos[
          activeIndex
        ]

      const shareUrl =
        `${window.location.origin}/watch/${activeVideo.id}`

      try {
        const nativeShare =
          Reflect.get(
            navigator,
            'share',
          )

        if (
          typeof nativeShare ===
          'function'
        ) {
          await nativeShare.call(
            navigator,
            {
              title:
                activeVideo.title,
              url:
                shareUrl,
            },
          )
        } else {
          await navigator.clipboard.writeText(
            shareUrl,
          )
        }

        setActionNotice(
          'Video link is ready to share.',
        )
      } catch (
        shareError
      ) {
        console.error(
          shareError,
        )

        setActionNotice(
          'Could not share this video.',
        )
      }
    }

  const markVideoFailed =
    (
      videoId: string,
    ) => {
      setFailedVideoIds(
        (
          current,
        ) => {
          const next =
            new Set(
              current,
            )

          next.add(
            videoId,
          )

          return next
        },
      )
    }

  if (isLoading) {
    return (
      <section className="playme-state">
        <div className="playme-state-card">
          <span className="playme-state-label">
            PLAYME
          </span>

          <strong>
            Loading vertical feed...
          </strong>

          <p>
            Preparing videos for
            playback.
          </p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="playme-state">
        <div className="playme-state-card playme-state-error">
          <span className="playme-state-label">
            PLAYME
          </span>

          <strong>
            Could not load Playme
          </strong>

          <p>
            {error}
          </p>
        </div>
      </section>
    )
  }

  if (
    videos.length === 0
  ) {
    return (
      <section className="playme-state">
        <div className="playme-state-card">
          <span className="playme-state-label">
            PLAYME
          </span>

          <strong>
            No videos yet
          </strong>

          <p>
            Vertical videos will
            appear here when they
            are available.
          </p>
        </div>
      </section>
    )
  }

  const activeVideo =
    videos[
      activeIndex
    ]

  const isActiveLiked =
    likedVideoIds.has(
      activeVideo.id,
    )

  return (
    <section className="playme-page">
      <div className="playme-stage">
        <div
          ref={feedRef}
          className="playme-feed"
          onScroll={
            handleScroll
          }
          onWheel={
            handleWheel
          }
        >
          {videos.map(
            (
              video,
              index,
            ) => {
              const failed =
                failedVideoIds.has(
                  video.id,
                )

              return (
                <article
                  key={
                    video.id
                  }
                  className="playme-slide"
                >
                  <div className="playme-video-shell">
                    <video
                      ref={(
                        element,
                      ) => {
                        videoRefs.current[
                          index
                        ] =
                          element
                      }}
                      className="playme-video"
                      src={`/api/v1/videos/${video.id}/stream`}
                      poster={
                        playmePosters[
                          index %
                            playmePosters.length
                        ]
                      }
                      muted={
                        isMuted
                      }
                      loop
                      playsInline
                      preload={
                        Math.abs(
                          index -
                            activeIndex,
                        ) <= 1
                          ? 'auto'
                          : 'metadata'
                      }
                      onClick={() =>
                        setIsPaused(
                          (
                            current,
                          ) =>
                            !current,
                        )
                      }
                      onError={() =>
                        markVideoFailed(
                          video.id,
                        )
                      }
                    />

                    <div className="playme-top-gradient" />

                    <div className="playme-bottom-gradient" />

                    <div className="playme-brand">
                      <span className="playme-brand-dot" />

                      <strong>
                        PLAYME
                      </strong>
                    </div>

                    {failed && (
                      <div className="playme-media-error">
                        <strong>
                          Video file is
                          unavailable
                        </strong>

                        <span>
                          Check the dev
                          media file for
                          this video ID.
                        </span>
                      </div>
                    )}

                    {index ===
                      activeIndex &&
                      isPaused &&
                      !failed && (
                        <button
                          type="button"
                          className="playme-center-play"
                          aria-label="Resume video"
                          onClick={() =>
                            setIsPaused(
                              false,
                            )
                          }
                        >
                          <PlayIcon />
                        </button>
                      )}

                    <div className="playme-slide-content">
                      <div className="playme-author-row">
                        <div className="playme-avatar">
                          {video.channelName
                            .charAt(
                              0,
                            )
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {
                              video.channelName
                            }
                          </strong>

                          <span>
                            Creator
                            profile
                            integration
                          </span>
                        </div>

                        <button
                          type="button"
                          className="playme-follow-button"
                          disabled
                          title="Channel subscriptions will connect later."
                        >
                          Follow
                        </button>
                      </div>

                      <h1>
                        {
                          video.title
                        }
                      </h1>

                      <div className="playme-meta">
                        <span>
                          {video.category ??
                            'Video'}
                        </span>

                        <span>
                          {formatViews(
                            video.viewCount,
                          )}{' '}
                          views
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              )
            },
          )}
        </div>

        <aside className="playme-actions">
          <button
            type="button"
            className="playme-action-button playme-navigation-button"
            aria-label="Previous video"
            disabled={
              activeIndex === 0
            }
            onClick={() =>
              goToIndex(
                activeIndex -
                  1,
              )
            }
          >
            <span className="playme-action-icon">
              <ChevronUpIcon />
            </span>

            <span>
              Prev
            </span>
          </button>

          <button
            type="button"
            className={
              isActiveLiked
                ? 'playme-action-button is-active'
                : 'playme-action-button'
            }
            aria-label="Like video"
            onClick={
              toggleLike
            }
          >
            <span className="playme-action-icon">
              <HeartIcon />
            </span>

            <span>
              Like
            </span>
          </button>

          <button
            type="button"
            className="playme-action-button"
            aria-label="Open comments"
            onClick={
              handleComments
            }
          >
            <span className="playme-action-icon">
              <CommentIcon />
            </span>

            <span>
              Comments
            </span>
          </button>

          <button
            type="button"
            className="playme-action-button"
            aria-label="Share video"
            onClick={() => {
              void handleShare()
            }}
          >
            <span className="playme-action-icon">
              <ShareIcon />
            </span>

            <span>
              Share
            </span>
          </button>

          <button
            type="button"
            className="playme-action-button"
            aria-label={
              isMuted
                ? 'Unmute video'
                : 'Mute video'
            }
            onClick={() =>
              setIsMuted(
                (
                  current,
                ) =>
                  !current,
              )
            }
          >
            <span className="playme-action-icon">
              <VolumeIcon
                muted={
                  isMuted
                }
              />
            </span>

            <span>
              {isMuted
                ? 'Sound'
                : 'Mute'}
            </span>
          </button>

          <button
            type="button"
            className="playme-action-button"
            aria-label={
              isPaused
                ? 'Play video'
                : 'Pause video'
            }
            onClick={() =>
              setIsPaused(
                (
                  current,
                ) =>
                  !current,
              )
            }
          >
            <span className="playme-action-icon">
              {isPaused ? (
                <PlayIcon />
              ) : (
                <PauseIcon />
              )}
            </span>

            <span>
              {isPaused
                ? 'Play'
                : 'Pause'}
            </span>
          </button>

          <button
            type="button"
            className="playme-action-button playme-navigation-button"
            aria-label="Next video"
            disabled={
              activeIndex ===
              videos.length - 1
            }
            onClick={() =>
              goToIndex(
                activeIndex +
                  1,
              )
            }
          >
            <span className="playme-action-icon">
              <ChevronDownIcon />
            </span>

            <span>
              Next
            </span>
          </button>
        </aside>

        <div className="playme-progress">
          <strong>
            {activeIndex + 1}
          </strong>

          <span>
            /
          </span>

          <span>
            {videos.length}
          </span>
        </div>

        {actionNotice && (
          <div className="playme-notice">
            {actionNotice}
          </div>
        )}
      </div>
    </section>
  )
}

export default PlaymePage