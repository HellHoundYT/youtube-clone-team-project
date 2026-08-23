import {
  useCallback,
  useEffect,
  useRef,
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
}: VideoPlayerProps) {
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
            void playResult.catch(
              () => {
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
    </div>
  )
}

export default VideoPlayer