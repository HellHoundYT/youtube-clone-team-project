import {
  useEffect,
  useState,
} from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'
import type {
  PlaylistService,
} from '../../../application/playlist/service'
import type {
  Playlist,
} from '../../../domain/playlist/types'
import {
  useAppTranslation,
} from '../../../shared/i18n'
import {
  useAuthStore,
} from '../../features/auth/authStore'
import './AddToPlaylistButton.css'

interface AddToPlaylistButtonProps {
  playlistService: PlaylistService
  videoId: string
}

function AddToPlaylistButton({
  playlistService,
  videoId,
}: AddToPlaylistButtonProps) {
  const { t } = useAppTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const profile = useAuthStore((state) => state.profile)
  const [isOpen, setIsOpen] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [busyPlaylistId, setBusyPlaylistId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !profile) {
      return
    }

    let cancelled = false

    void playlistService
      .list()
      .then((items) => {
        if (!cancelled) {
          setPlaylists(items)
          setError('')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('system.playlists.requestFailed'))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, playlistService, profile, t])

  const toggleMenu = () => {
    if (!profile) {
      navigate('/auth', {
        state: {
          from: location.pathname,
        },
      })
      return
    }

    if (isOpen) {
      setIsOpen(false)
      return
    }

    setError('')
    setIsLoading(true)
    setIsOpen(true)
  }

  const togglePlaylist = async (playlist: Playlist) => {
    if (busyPlaylistId) {
      return
    }

    const containsVideo = playlist.videoIds.includes(videoId)
    setBusyPlaylistId(playlist.id)

    try {
      if (containsVideo) {
        await playlistService.removeVideo(playlist.id, videoId)
      } else {
        await playlistService.addVideo(playlist.id, videoId)
      }

      setPlaylists((current) =>
        current.map((item) =>
          item.id === playlist.id
            ? {
                ...item,
                videoIds: containsVideo
                  ? item.videoIds.filter((id) => id !== videoId)
                  : [...item.videoIds, videoId],
              }
            : item,
        ),
      )
      setError('')
    } catch {
      setError(t('system.playlists.requestFailed'))
    } finally {
      setBusyPlaylistId(null)
    }
  }

  return (
    <div className="add-playlist-control">
      <button
        type="button"
        className="add-playlist-trigger"
        onClick={toggleMenu}
      >
        + {t('system.playlists.addToPlaylist')}
      </button>

      {isOpen && (
        <div className="add-playlist-menu">
          <div className="add-playlist-menu-heading">
            <strong>{t('system.playlists.choosePlaylist')}</strong>
            <button
              type="button"
              aria-label={t('system.playlists.closeMenu')}
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          {error && (
            <p className="add-playlist-error">{error}</p>
          )}

          {isLoading ? (
            <p>{t('system.playlists.loading')}</p>
          ) : playlists.length === 0 ? (
            <div className="add-playlist-empty">
              <p>{t('system.playlists.emptyTitle')}</p>
              <button
                type="button"
                onClick={() => navigate('/playlists')}
              >
                {t('system.playlists.create')}
              </button>
            </div>
          ) : (
            <div className="add-playlist-options">
              {playlists.map((playlist) => {
                const isAdded = playlist.videoIds.includes(videoId)

                return (
                  <button
                    type="button"
                    key={playlist.id}
                    disabled={busyPlaylistId === playlist.id}
                    onClick={() => {
                      void togglePlaylist(playlist)
                    }}
                  >
                    <span>{playlist.title}</span>
                    <strong>
                      {isAdded
                        ? t('system.playlists.added')
                        : t('system.playlists.add')}
                    </strong>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddToPlaylistButton
