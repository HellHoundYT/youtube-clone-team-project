import type {
  Playlist,
} from '../../domain/playlist/types'

export interface SavePlaylistRequest {
  title: string
  description: string
}

export interface PlaylistGateway {
  list(): Promise<Playlist[]>

  create(
    request: SavePlaylistRequest,
  ): Promise<Playlist>

  update(
    playlistId: string,
    request: SavePlaylistRequest,
  ): Promise<Playlist>

  delete(
    playlistId: string,
  ): Promise<void>
}
