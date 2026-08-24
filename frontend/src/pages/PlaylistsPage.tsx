import {
  type FormEvent,
  useState,
} from 'react'
import type {
  Playlist,
} from '../features/playlists/playlistStore'
import {
  usePlaylistStore,
} from '../features/playlists/playlistStore'
import {
  useAppTranslation,
} from '../shared/i18n'
import './PlaylistsPage.css'

function PlaylistsPage() {
  const { t, i18n } = useAppTranslation()
  const playlists = usePlaylistStore((state) => state.playlists)
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist)
  const updatePlaylist = usePlaylistStore((state) => state.updatePlaylist)
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist)
  const [isCreating, setIsCreating] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const openCreate = () => {
    setEditingPlaylist(null)
    setTitle('')
    setDescription('')
    setIsCreating(true)
  }

  const openEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
    setTitle(playlist.title)
    setDescription(playlist.description)
    setIsCreating(true)
  }

  const closeDialog = () => {
    setIsCreating(false)
    setEditingPlaylist(null)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    if (editingPlaylist) {
      updatePlaylist({ ...editingPlaylist, title: cleanTitle, description: description.trim() })
    } else {
      createPlaylist(cleanTitle, description.trim())
    }
    closeDialog()
  }

  const dateLocale = i18n.resolvedLanguage?.startsWith('uk') ? 'uk-UA' : 'en-US'

  return (
    <section className="playlists-page">
      <div className="playlists-heading">
        <div>
          <p>{t('system.playlists.eyebrow')}</p>
          <h1>{t('system.playlists.title')}</h1>
          <span>{t('system.playlists.lead')}</span>
        </div>
        <button className="playlist-create-button" type="button" onClick={openCreate}>+ {t('system.playlists.create')}</button>
      </div>

      {playlists.length === 0 ? (
        <div className="playlists-empty">
          <div>☷</div>
          <h2>{t('system.playlists.emptyTitle')}</h2>
          <p>{t('system.playlists.emptyLead')}</p>
          <button className="playlist-create-button" type="button" onClick={openCreate}>{t('system.playlists.create')}</button>
        </div>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist, index) => (
            <article className="playlist-card" key={playlist.id}>
              <div className={`playlist-cover tone-${index % 4}`}><span>☷</span><small>{t('system.playlists.noVideos')}</small></div>
              <div className="playlist-card-copy">
                <h2>{playlist.title}</h2>
                <p>{playlist.description || t('system.playlists.noDescription')}</p>
                <span>{t('system.playlists.created')} {new Intl.DateTimeFormat(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(playlist.createdAt))}</span>
              </div>
              <div className="playlist-card-actions">
                <button type="button" onClick={() => openEdit(playlist)}>{t('system.playlists.edit')}</button>
                <button type="button" onClick={() => deletePlaylist(playlist.id)}>{t('system.playlists.delete')}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isCreating && (
        <div className="playlist-modal-backdrop" role="presentation" onMouseDown={closeDialog}>
          <form className="playlist-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
            <p>{t('system.playlists.eyebrow')}</p>
            <h2>{editingPlaylist ? t('system.playlists.editTitle') : t('system.playlists.createTitle')}</h2>
            <label>{t('system.playlists.name')}<input value={title} maxLength={80} autoFocus onChange={(event) => setTitle(event.target.value)} /></label>
            <label>{t('system.playlists.description')}<textarea value={description} maxLength={300} rows={4} onChange={(event) => setDescription(event.target.value)} /></label>
            <div><button className="playlist-cancel" type="button" onClick={closeDialog}>{t('system.playlists.cancel')}</button><button className="playlist-create-button" type="submit">{editingPlaylist ? t('system.playlists.save') : t('system.playlists.create')}</button></div>
          </form>
        </div>
      )}
    </section>
  )
}

export default PlaylistsPage
