import { useState } from 'react'
import { useAppTranslation } from '../i18n'
import './MusicPage.css'

type Track = {
  title: string
  artist: string
  duration: string
  artwork: string
  colors: string
}

const tracks: Track[] = [
  { title: 'Midnight City', artist: 'Neon District', duration: '3:42', artwork: '/demo/thumbnails/midnight-city.webp', colors: 'violet' },
  { title: 'Night Drive Mix', artist: 'Pulse Radio', duration: '42:18', artwork: '/demo/thumbnails/night-drive-mix.webp', colors: 'blue' },
  { title: 'Wave Session', artist: 'Mira Vale', duration: '4:05', artwork: '/demo/thumbnails/wave-session.webp', colors: 'pink' },
  { title: 'Beyond the Horizon', artist: 'Lumen', duration: '3:28', artwork: '/demo/thumbnails/beyond-the-horizon.webp', colors: 'orange' },
]

function PlayIcon({ paused = false }: { paused?: boolean }) {
  return paused ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14M17 5v14" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
}

function MusicPage() {
  const { t } = useAppTranslation()
  const [activeTrack, setActiveTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const current = tracks[activeTrack]

  const selectTrack = (index: number) => {
    setActiveTrack(index)
    setIsPlaying(true)
  }

  return (
    <main className="music-page">
      <section className="music-hero">
        <div className="music-hero-copy">
          <span className="music-eyebrow">{t('music.eyebrow')}</span>
          <h1>{t('music.title')}</h1>
          <p>{t('music.description')}</p>
          <button className="music-listen-button" type="button" onClick={() => setIsPlaying(true)}>
            <PlayIcon /> {t('music.listenNow')}
          </button>
        </div>
        <div className="music-hero-art" aria-hidden="true">
          <div className="music-disc music-disc-back" />
          <div className="music-cover"><img src={current.artwork} alt="" /></div>
          <div className="music-disc music-disc-front"><span /></div>
        </div>
      </section>

      <section className="music-section">
        <div className="music-section-heading"><h2>{t('music.popular')}</h2><span>01 — 04</span></div>
        <div className="music-track-list">
          {tracks.map((track, index) => (
            <button className={`music-track ${activeTrack === index ? 'is-active' : ''}`} type="button" key={track.title} onClick={() => selectTrack(index)}>
              <span className="music-track-number">{activeTrack === index && isPlaying ? <span className="music-equalizer"><i /><i /><i /></span> : String(index + 1).padStart(2, '0')}</span>
              <img src={track.artwork} alt="" />
              <span className="music-track-info"><strong>{track.title}</strong><small>{track.artist}</small></span>
              <span className="music-track-duration">{track.duration}</span>
              <span className="music-track-play"><PlayIcon /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="music-section">
        <div className="music-section-heading"><h2>{t('music.madeForYou')}</h2></div>
        <div className="music-mix-grid">
          {tracks.slice(0, 3).map((track, index) => <button type="button" className={`music-mix-card ${track.colors}`} key={track.title} onClick={() => selectTrack(index)}><img src={track.artwork} alt="" /><span>Mix {String(index + 1).padStart(2, '0')}</span><strong>{index === 0 ? 'After dark' : index === 1 ? 'Keep moving' : 'Soft focus'}</strong><small>{track.artist} and more</small><i><PlayIcon /></i></button>)}
        </div>
      </section>

      <div className="music-player" aria-label={t('music.playing')}>
        <img src={current.artwork} alt="" />
        <div className="music-player-info"><strong>{current.title}</strong><span>{current.artist}</span></div>
        <button type="button" className="music-player-toggle" aria-label={isPlaying ? t('music.pause') : t('music.play')} onClick={() => setIsPlaying((value) => !value)}><PlayIcon paused={isPlaying} /></button>
        <div className="music-progress"><i /></div>
        <span className="music-time">1:24&nbsp; / &nbsp;{current.duration}</span>
      </div>
    </main>
  )
}

export default MusicPage
