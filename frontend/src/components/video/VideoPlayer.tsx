import {
  useRef,
  type SyntheticEvent,
} from 'react'

interface VideoPlayerProps {
  src: string
  title: string
  poster?: string | null
  initialTime?: number
  onFirstPlay?: () => void
  onProgress?: (
    currentTime: number,
    duration: number,
    completed: boolean,
  ) => void
}

function VideoPlayer({
  src,
  title,
  poster,
  initialTime = 0,
  onFirstPlay,
  onProgress,
}: VideoPlayerProps) {
  const countedSourceRef =
    useRef<string | null>(null)

  const seekedSourceRef =
    useRef<string | null>(null)

  const lastReportedSecondRef =
    useRef(0)

  const handlePlay = () => {
    if (
      countedSourceRef.current ===
      src
    ) {
      return
    }

    countedSourceRef.current = src

    onFirstPlay?.()
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
      seekedSourceRef.current ===
      src
    ) {
      return
    }

    seekedSourceRef.current = src

    const duration =
      Number.isFinite(
        element.duration,
      )
        ? element.duration
        : 0

    if (
      initialTime <= 0 ||
      duration <= 0
    ) {
      lastReportedSecondRef.current =
        0

      return
    }

    const safeTime =
      Math.min(
        initialTime,
        Math.max(
          0,
          duration - 0.25,
        ),
      )

    element.currentTime =
      safeTime

    lastReportedSecondRef.current =
      Math.floor(
        safeTime,
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
        lastReportedSecondRef.current <
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
  }

  const handleEnded = (
    event:
      SyntheticEvent<
        HTMLVideoElement
      >,
  ) => {
    reportProgress(
      event.currentTarget,
      true,
    )
  }

  return (
    <div className="video-player-shell">
      <video
        key={src}
        className="video-player"
        controls
        preload="metadata"
        playsInline
        poster={
          poster ?? undefined
        }
        aria-label={title}
        onLoadedMetadata={
          handleLoadedMetadata
        }
        onPlay={handlePlay}
        onTimeUpdate={
          handleTimeUpdate
        }
        onPause={handlePause}
        onEnded={handleEnded}
      >
        <source
          src={src}
          type="video/mp4"
        />

        Your browser does not support
        HTML5 video.
      </video>
    </div>
  )
}

export default VideoPlayer