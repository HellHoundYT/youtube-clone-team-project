interface VideoPlayerProps {
  src: string
  title: string
  poster?: string | null
}

function VideoPlayer({
  src,
  title,
  poster,
}: VideoPlayerProps) {
  return (
    <div className="video-player-shell">
      <video
        key={src}
        className="video-player"
        controls
        preload="metadata"
        playsInline
        poster={poster ?? undefined}
        aria-label={title}
      >
        <source src={src} type="video/mp4" />

        Your browser does not support HTML5 video.
      </video>
    </div>
  )
}

export default VideoPlayer