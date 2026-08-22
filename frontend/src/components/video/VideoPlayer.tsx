import { useRef } from 'react'

interface VideoPlayerProps {
  src: string
  title: string
  poster?: string | null
  onFirstPlay?: () => void
}

function VideoPlayer({
  src,
  title,
  poster,
  onFirstPlay,
}: VideoPlayerProps) {
  const countedSourceRef =
    useRef<string | null>(null)

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
        onPlay={handlePlay}
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