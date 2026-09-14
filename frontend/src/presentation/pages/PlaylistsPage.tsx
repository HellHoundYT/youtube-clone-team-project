import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import type {
  PlaylistService,
} from '../../application/playlist/service'
import type {
  VideoService,
} from '../../application/video/service'
import type {
  Playlist,
} from '../../domain/playlist/types'
import type {
  VideoDetails,
} from '../../domain/video/types'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './PlaylistsPage.css'

interface PlaylistsPageProps {
  playlistService: PlaylistService
  videoService: VideoService
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const remaining = safe % 60

  return `${minutes}:${remaining
    .toString()
    .padStart(2, '0')}`
}

function PlaylistsPage({
  playlistService,
  videoService,
}: PlaylistsPageProps) {
  const { t, i18n } = useAppTranslation()
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [videosById, setVideosById] = useState<Record<string, VideoDetails>>({})
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [busyVideoId, setBusyVideoId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const items = await playlistService.list()
        const videoIds = [
          ...new Set(
            items.flatMap((playlist) => playlist.videoIds),
          ),
        ]

        const loadedVideos = await Promise.all(
          videoIds.map(async (videoId) => {
            try {
              return await videoService.getVideoById(
                videoId,
                controller.signal,
              )
            } catch {
              return null
            }
          }),
        )

        if (controller.signal.aborted) {
          return
        }

        const videoMap: Record<string, VideoDetails> = {}
        for (const video of loadedVideos) {
          if (video) {
            videoMap[video.id] = video
          }
        }

        setError('')
        setPlaylists(items)
        setVideosById(videoMap)
      } catch {
        if (!controller.signal.aborted) {
          setError(t('system.playlists.requestFailed'))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => controller.abort()
  }, [playlistService, t, videoService])

  const selectedPlaylist = useMemo(
    () =>
      playlists.find(
        (playlist) => playlist.id === selectedPlaylistId,
      ) ?? null,
    [playlists, selectedPlaylistId],
  )

  const openCreate = () => {
    setEditingPlaylist(null)
    setTitle('')
    setDescription('')
    setError('')
    setIsCreating(true)
  }

  const openEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
    setTitle(playlist.title)
    setDescription(playlist.description)
    setError('')
    setIsCreating(true)
  }

  const closeDialog = () => {
    if (isSaving) {
      return
    }

    setIsCreating(false)
    setEditingPlaylist(null)
  }

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    const cleanTitle = title.trim()

    if (!cleanTitle || isSaving) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      if (editingPlaylist) {
        const updated = await playlistService.update(
          editingPlaylist.id,
          {
            title: cleanTitle,
            description: description.trim(),
          },
        )

        setPlaylists((current) =>
          current.map((playlist) =>
            playlist.id === updated.id
              ? updated
              : playlist,
          ),
        )
      } else {
        const created = await playlistService.create({
          title: cleanTitle,
          description: description.trim(),
        })

        setPlaylists((current) => [created, ...current])
      }

      setIsCreating(false)
      setEditingPlaylist(null)
    } catch {
      setError(t('system.playlists.requestFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    if (!window.confirm(t('system.playlists.deleteConfirm'))) {
      return
    }

    try {
      setError('')
      await playlistService.delete(playlistId)
      setPlaylists((current) =>
        current.filter((playlist) => playlist.id !== playlistId),
      )
      setSelectedPlaylistId((current) =>
        current === playlistId ? null : current,
      )
    } catch {
      setError(t('system.playlists.requestFailed'))
    }
  }

  const removeVideo = async (
    playlistId: string,
    videoId: string,
  ) => {
    if (busyVideoId) {
      return
    }

    setBusyVideoId(videoId)
    try {
      setError('')
      await playlistService.removeVideo(playlistId, videoId)
      setPlaylists((current) =>
        current.map((playlist) =>
          playlist.id === playlistId
            ? {
                ...playlist,
                videoIds: playlist.videoIds.filter(
                  (id) => id !== videoId,
                ),
              }
            : playlist,
        ),
      )
    } catch {
      setError(t('system.playlists.requestFailed'))
    } finally {
      setBusyVideoId(null)
    }
  }

  const dateLocale =
    i18n.resolvedLanguage?.startsWith('uk')
      ? 'uk-UA'
      : 'en-US'

  return (
    <section className="playlists-page">
      <div className="playlists-heading">
        <div>
          <p>{t('system.playlists.eyebrow')}</p>
          <h1>{t('system.playlists.title')}</h1>
          <span>{t('system.playlists.lead')}</span>
        </div>
        <button
          className="playlist-create-button"
          type="button"
          onClick={openCreate}
        >
          + {t('system.playlists.create')}
        </button>
      </div>

      {error && (
        <div className="playlists-error">
          {error}
        </div>
      )}

      {selectedPlaylist && (
        <section className="playlist-detail">
          <div className="playlist-detail-heading">
            <div>
              <button
                type="button"
                className="playlist-detail-back"
                onClick={() => setSelectedPlaylistId(null)}
              >
                {t('system.playlists.back')}
              </button>
              <h2>{selectedPlaylist.title}</h2>
              <p>
                {selectedPlaylist.description ||
                  t('system.playlists.noDescription')}
              </p>
            </div>
            <span>
              {t('system.playlists.videoCount', {
                count: selectedPlaylist.videoIds.length,
              })}
            </span>
          </div>

          {selectedPlaylist.videoIds.length === 0 ? (
            <div className="playlists-empty playlist-detail-empty">
              <strong>{t('system.playlists.noVideos')}</strong>
              <p>{t('system.playlists.addFromWatchHint')}</p>
            </div>
          ) : (
            <div className="playlist-video-grid">
              {selectedPlaylist.videoIds.map((videoId) => {
                const video = videosById[videoId]

                return (
                  <article className="playlist-video-card" key={videoId}>
                    <button
                      type="button"
                      className="playlist-video-thumbnail"
                      onClick={() => navigate(`/watch/${videoId}`)}
                    >
                      {video?.thumbnailPath ? (
                        <img src={video.thumbnailPath} alt="" />
                      ) : (
                        <span>A</span>
                      )}
                      {video && (
                        <small>{formatDuration(video.durationSeconds)}</small>
                      )}
                    </button>
                    <div className="playlist-video-copy">
                      <strong>
                        {video?.title ?? t('system.playlists.videoUnavailable')}
                      </strong>
                      <span>{video?.channelName ?? 'AMTLIS'}</span>
                    </div>
                    <button
                      type="button"
                      className="playlist-remove-video"
                      disabled={busyVideoId === videoId}
                      onClick={() => {
                        void removeVideo(selectedPlaylist.id, videoId)
                      }}
                    >
                      {t('system.playlists.removeVideo')}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {isLoading ? (
        <div className="playlists-empty">
          <p>{t('system.playlists.loading')}</p>
        </div>
      ) : playlists.length === 0 ? (
        <div className="playlists-empty">
          <div>☷</div>
          <h2>{t('system.playlists.emptyTitle')}</h2>
          <p>{t('system.playlists.emptyLead')}</p>
          <button
            className="playlist-create-button"
            type="button"
            onClick={openCreate}
          >
            {t('system.playlists.create')}
          </button>
        </div>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist, index) => {
            const coverVideo =
              playlist.videoIds.length > 0
                ? videosById[playlist.videoIds[0]]
                : null

            return (
              <article
                className="playlist-card"
                key={playlist.id}
              >
                <button
                  className={`playlist-cover tone-${index % 4}`}
                  type="button"
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                >
                  {coverVideo?.thumbnailPath ? (
                    <img src={coverVideo.thumbnailPath} alt="" />
                  ) : (
                    <span>☷</span>
                  )}
                  <small>
                    {t('system.playlists.videoCount', {
                      count: playlist.videoIds.length,
                    })}
                  </small>
                </button>
                <div className="playlist-card-copy">
                  <h2>{playlist.title}</h2>
                  <p>
                    {playlist.description ||
                      t('system.playlists.noDescription')}
                  </p>
                  <span>
                    {t('system.playlists.created')}{' '}
                    {new Intl.DateTimeFormat(
                      dateLocale,
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      },
                    ).format(new Date(playlist.createdAt))}
                  </span>
                </div>
                <div className="playlist-card-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                  >
                    {t('system.playlists.open')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(playlist)}
                  >
                    {t('system.playlists.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void deletePlaylist(playlist.id)
                    }}
                  >
                    {t('system.playlists.delete')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {isCreating && (
        <div
          className="playlist-modal-backdrop"
          role="presentation"
          onMouseDown={closeDialog}
        >
          <form
            className="playlist-modal"
            onSubmit={(event) => {
              void submit(event)
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p>{t('system.playlists.eyebrow')}</p>
            <h2>
              {editingPlaylist
                ? t('system.playlists.editTitle')
                : t('system.playlists.createTitle')}
            </h2>
            <label>
              {t('system.playlists.name')}
              <input
                value={title}
                maxLength={80}
                autoFocus
                disabled={isSaving}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              {t('system.playlists.description')}
              <textarea
                value={description}
                maxLength={300}
                rows={4}
                disabled={isSaving}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div>
              <button
                className="playlist-cancel"
                type="button"
                disabled={isSaving}
                onClick={closeDialog}
              >
                {t('system.playlists.cancel')}
              </button>
              <button
                className="playlist-create-button"
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? t('system.playlists.saving')
                  : editingPlaylist
                    ? t('system.playlists.save')
                    : t('system.playlists.create')}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default PlaylistsPage
