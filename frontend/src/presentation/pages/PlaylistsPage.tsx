import {
  type FormEvent,
  useEffect,
  useState,
} from 'react'
import type {
  PlaylistService,
} from '../../application/playlist/service'
import type {
  Playlist,
} from '../../domain/playlist/types'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './PlaylistsPage.css'

interface PlaylistsPageProps {
  playlistService: PlaylistService
}

function PlaylistsPage({
  playlistService,
}: PlaylistsPageProps) {
  const { t, i18n } = useAppTranslation()
  const [playlists, setPlaylists] =
    useState<Playlist[]>([])
  const [isLoading, setIsLoading] =
    useState(true)
  const [isSaving, setIsSaving] =
    useState(false)
  const [error, setError] =
    useState('')
  const [isCreating, setIsCreating] =
    useState(false)
  const [editingPlaylist, setEditingPlaylist] =
    useState<Playlist | null>(null)
  const [title, setTitle] =
    useState('')
  const [description, setDescription] =
    useState('')

  useEffect(() => {
    void playlistService
      .list()
      .then((items) => {
        setError('')
        setPlaylists(items)
      })
      .catch(() => {
        setError(
          t('system.playlists.requestFailed'),
        )
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [
    playlistService,
    t,
  ])

  const openCreate = () => {
    setEditingPlaylist(null)
    setTitle('')
    setDescription('')
    setError('')
    setIsCreating(true)
  }

  const openEdit = (
    playlist: Playlist,
  ) => {
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
        const updated =
          await playlistService.update(
            editingPlaylist.id,
            {
              title: cleanTitle,
              description:
                description.trim(),
            },
          )

        setPlaylists(
          (current) =>
            current.map(
              (playlist) =>
                playlist.id === updated.id
                  ? updated
                  : playlist,
            ),
        )
      } else {
        const created =
          await playlistService.create({
            title: cleanTitle,
            description:
              description.trim(),
          })

        setPlaylists(
          (current) => [
            created,
            ...current,
          ],
        )
      }

      setIsCreating(false)
      setEditingPlaylist(null)
    } catch {
      setError(
        t('system.playlists.requestFailed'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const deletePlaylist = async (
    playlistId: string,
  ) => {
    try {
      setError('')
      await playlistService.delete(
        playlistId,
      )
      setPlaylists(
        (current) =>
          current.filter(
            (playlist) =>
              playlist.id !== playlistId,
          ),
      )
    } catch {
      setError(
        t('system.playlists.requestFailed'),
      )
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
        <div className="playlists-empty">
          <p>{error}</p>
        </div>
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
          {playlists.map((playlist, index) => (
            <article
              className="playlist-card"
              key={playlist.id}
            >
              <div className={`playlist-cover tone-${index % 4}`}>
                <span>☷</span>
                <small>{t('system.playlists.noVideos')}</small>
              </div>
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
                  ).format(
                    new Date(playlist.createdAt),
                  )}
                </span>
              </div>
              <div className="playlist-card-actions">
                <button
                  type="button"
                  onClick={() => openEdit(playlist)}
                >
                  {t('system.playlists.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void deletePlaylist(
                      playlist.id,
                    )
                  }}
                >
                  {t('system.playlists.delete')}
                </button>
              </div>
            </article>
          ))}
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
            onMouseDown={(event) =>
              event.stopPropagation()
            }
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
                onChange={(event) =>
                  setTitle(event.target.value)
                }
              />
            </label>
            <label>
              {t('system.playlists.description')}
              <textarea
                value={description}
                maxLength={300}
                rows={4}
                disabled={isSaving}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
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
