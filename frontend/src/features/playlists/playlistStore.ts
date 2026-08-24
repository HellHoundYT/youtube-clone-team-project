import {
  create,
} from 'zustand'

export interface Playlist {
  id: string
  title: string
  description: string
  createdAt: string
}

interface PlaylistState {
  playlists: Playlist[]
  createPlaylist: (title: string, description: string) => void
  updatePlaylist: (playlist: Playlist) => void
  deletePlaylist: (playlistId: string) => void
}

const storageKey =
  'amtlis.playlists'

function readPlaylists(): Playlist[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(storageKey)
    const parsed = stored ? JSON.parse(stored) : []

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePlaylists(playlists: Playlist[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(playlists))
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: readPlaylists(),

  createPlaylist: (title, description) => {
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      title,
      description,
      createdAt: new Date().toISOString(),
    }
    const next = [playlist, ...get().playlists]
    savePlaylists(next)
    set({ playlists: next })
  },

  updatePlaylist: (playlist) => {
    const next = get().playlists.map((current) => current.id === playlist.id ? playlist : current)
    savePlaylists(next)
    set({ playlists: next })
  },

  deletePlaylist: (playlistId) => {
    const next = get().playlists.filter((playlist) => playlist.id !== playlistId)
    savePlaylists(next)
    set({ playlists: next })
  },
}))
