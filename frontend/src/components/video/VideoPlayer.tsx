import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react'

export interface VideoPlaybackCommand {
  revision: number
  currentTime: number
  isPlaying: boolean
}

export interface VideoPlaybackAction {
  currentTime: number
  isPlaying: boolean
  reason:
    | 'play'
    | 'pause'
    | 'seek'
}

interface VideoPlayerProps {
  src: string
  title: string
  poster?: string | null
  initialTime?: number

  controlsEnabled?: boolean

  playbackCommand?:
    | VideoPlaybackCommand
    | null

  onFirstPlay?: () => void

  onProgress?: (
    currentTime: number,
    duration: number,
    completed: boolean,
  ) => void

  onPlaybackAction?: (
    action: VideoPlaybackAction,
  ) => void

  onPlaybackBlocked?: () => void

  blockedPlaybackTitle?: string
  blockedPlaybackHint?: string
  blockedPlaybackAction?: string

  onPlaybackResumedByUser?: () => void
}

function VideoPlayer({
  src,
  title,
  poster,
  initialTime = 0,
  controlsEnabled = true,
  playbackCommand = null,
  onFirstPlay,
  onProgress,
  onPlaybackAction,
  onPlaybackBlocked,
  blockedPlaybackTitle,
  blockedPlaybackHint,
  blockedPlaybackAction,
  onPlaybackResumedByUser,
}: VideoPlayerProps) {
  const [
    playbackBlocked,
    setPlaybackBlocked,
  ] =
    useState(false)

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    )

  const countedSourceRef =
    useRef<string | null>(
      null,
    )

  const seekedSourceRef =
    useRef<string | null>(
      null,
    )

  const lastReportedSecondRef =
    useRef(0)

  const lastAppliedRevisionRef =
    useRef<number | null>(
      null,
    )

  const suppressPlaybackActionsRef =
    useRef(false)

  const suppressSeekActionRef =
    useRef(false)

  const releaseSuppressionTimerRef =
    useRef<number | null>(
      null,
    )

  const releasePlaybackSuppression =
    useCallback(
      () => {
        if (
          releaseSuppressionTimerRef
            .current !== null
        ) {
          window.clearTimeout(
            releaseSuppressionTimerRef
              .current,
          )
        }

        releaseSuppressionTimerRef.current =
          window.setTimeout(
            () => {
              suppressPlaybackActionsRef
                .current =
                  false

              releaseSuppressionTimerRef
                .current =
                  null
            },
            700,
          )
      },
      [],
    )

  const applyPlaybackCommand =
    useCallback(
      (
        element:
          HTMLVideoElement,
      ) => {
        const command =
          playbackCommand

        if (
          !command ||
          lastAppliedRevisionRef
            .current ===
            command.revision ||
          element.readyState <
            HTMLMediaElement.HAVE_METADATA
        ) {
          return
        }

        lastAppliedRevisionRef.current =
          command.revision

        suppressPlaybackActionsRef.current =
          true

        const duration =
          Number.isFinite(
            element.duration,
          )
            ? Math.max(
                0,
                element.duration,
              )
            : 0

        const requestedTime =
          Math.max(
            0,
            command.currentTime,
          )

        const safeTime =
          duration > 0
            ? Math.min(
                requestedTime,
                Math.max(
                  0,
                  duration - 0.1,
                ),
              )
            : requestedTime

        if (
          Math.abs(
            element.currentTime -
              safeTime,
          ) > 0.25
        ) {
          suppressSeekActionRef.current =
            true

          element.currentTime =
            safeTime
        }

        if (
          command.isPlaying
        ) {
          const playResult =
            element.play()

          if (
            playResult
          ) {
            void playResult
              .then(
                () => {
                  setPlaybackBlocked(
                    false,
                  )
                },
              )
              .catch(
                () => {
                  setPlaybackBlocked(
                    true,
                  )

                  onPlaybackBlocked?.()
                },
              )
          }
        } else if (
          !element.paused
        ) {
          element.pause()
        }

        releasePlaybackSuppression()
      },
      [
        onPlaybackBlocked,
        playbackCommand,
        releasePlaybackSuppression,
      ],
    )

  useEffect(() => {
    lastAppliedRevisionRef.current =
      null

    suppressPlaybackActionsRef.current =
      false

    suppressSeekActionRef.current =
      false
  }, [
    src,
  ])

  useEffect(() => {
    const element =
      videoRef.current

    if (!element) {
      return
    }

    applyPlaybackCommand(
      element,
    )
  }, [
    applyPlaybackCommand,
  ])

  useEffect(() => {
    return () => {
      if (
        releaseSuppressionTimerRef
          .current !== null
      ) {
        window.clearTimeout(
          releaseSuppressionTimerRef
            .current,
        )
      }
    }
  }, [])

  const emitPlaybackAction = (
    element: HTMLVideoElement,
    reason:
      | 'play'
      | 'pause'
      | 'seek',
  ) => {
    if (
      suppressPlaybackActionsRef
        .current
    ) {
      return
    }

    onPlaybackAction?.({
      currentTime:
        Math.max(
          0,
          element.currentTime,
        ),

      isPlaying:
        !element.paused &&
        !element.ended,

      reason,
    })
  }

  const handlePlay = (
    event:
      SyntheticEvent<
        HTMLVideoElement
      >,
  ) => {
    const element =
      event.currentTarget

    if (
      countedSourceRef.current !==
      src
    ) {
      countedSourceRef.current =
        src

      onFirstPlay?.()
    }

    emitPlaybackAction(
      element,
      'play',
    )
  }

  const handleLoadedMetadata = (
    event:
      SyntheticEvent<
        HTMLVideoElement
      >,
  ) => {
    const element =
      event.currentTarget

    if (
      seekedSourceRef.current !==
      src
    ) {
      seekedSourceRef.current =
        src

      const duration =
        Number.isFinite(
          element.duration,
        )
          ? element.duration
          : 0

      if (
        initialTime > 0 &&
        duration > 0
      ) {
        const safeTime =
          Math.min(
            initialTime,
            Math.max(
              0,
              duration - 0.25,
            ),
          )

        suppressSeekActionRef.current =
          true

        element.currentTime =
          safeTime

        lastReportedSecondRef.current =
          Math.floor(
            safeTime,
          )
      } else {
        lastReportedSecondRef.current =
          0
      }
    }

    applyPlaybackCommand(
      element,
    )
  }

  const reportProgress = (
    element: HTMLVideoElement,
    completed: boolean,
  ) => {
    const duration =
      Number.isFinite(
        element.duration,
      )
        ? Math.max(
            0,
            Math.floor(
              element.duration,
            ),
          )
        : 0

    const currentTime =
      completed
        ? duration
        : Math.max(
            0,
            Math.floor(
              element.currentTime,
            ),
          )

    if (duration <= 0) {
      return
    }

    lastReportedSecondRef.current =
      currentTime

    onProgress?.(
      currentTime,
      duration,
      completed,
    )
  }

  const handleTimeUpdate = (
    event:
      SyntheticEvent<
        HTMLVideoElement
      >,
  ) => {
    const element =
      event.currentTarget

    const currentTime =
      Math.max(
        0,
        Math.floor(
          element.currentTime,
        ),
      )

    if (
      currentTime -
        lastReportedSecondRef
          .current <
      5
    ) {
      return
    }

    reportProgress(
      element,
      false,
    )
  }

  const handlePause = (
    event:
      SyntheticEvent<
        HTMLVideoElement
      >,
  ) => {
    const element =
      event.currentTarget

    if (
      element.ended
    ) {
      return
    }

    reportProgress(
      element,
      false,
    )

    emitPlaybackAction(
      element,
      'pause',
    )
  }

  const handleSeeked = (
    event:
      SyntheticEvent<
        HTMLVideoElement
      >,
  ) => {
    if (
      suppressSeekActionRef.current
    ) {
      suppressSeekActionRef.current =
        false

      return
    }

    emitPlaybackAction(
      event.currentTarget,
      'seek',
    )
  }

  const handleEnded = (
    event:
      SyntheticEvent<
        HTMLVideoElement
      >,
  ) => {
    const element =
      event.currentTarget

    reportProgress(
      element,
      true,
    )

    emitPlaybackAction(
      element,
      'pause',
    )
  }

  const handleBlockedPlaybackResume =
    () => {
      const element =
        videoRef.current

      if (!element) {
        return
      }

      const playResult =
        element.play()

      void playResult
        .then(
          () => {
            setPlaybackBlocked(
              false,
            )

            onPlaybackResumedByUser?.()
          },
        )
        .catch(
          () => {
            setPlaybackBlocked(
              true,
            )
          },
        )
    }

  return (
    <div className="video-player-shell">
      <video
        ref={
          videoRef
        }
        key={src}
        className="video-player"
        controls={
          controlsEnabled
        }
        preload="metadata"
        playsInline
        poster={
          poster ?? undefined
        }
        aria-label={
          title
        }
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onPlay={
          handlePlay
        }
        onTimeUpdate={
          handleTimeUpdate
        }
        onPause={
          handlePause
        }
        onSeeked={
          handleSeeked
        }
        onEnded={
          handleEnded
        }
      >
        <source
          src={
            src
          }
          type="video/mp4"
        />

        Your browser does not support
        HTML5 video.
      </video>

      {playbackBlocked &&
        blockedPlaybackAction && (
        <div className="video-player-playback-blocked">
          {blockedPlaybackTitle && (
            <strong>
              {
                blockedPlaybackTitle
              }
            </strong>
          )}

          {blockedPlaybackHint && (
            <p>
              {
                blockedPlaybackHint
              }
            </p>
          )}

          <button
            type="button"
            onClick={
              handleBlockedPlaybackResume
            }
          >
            {
              blockedPlaybackAction
            }
          </button>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer