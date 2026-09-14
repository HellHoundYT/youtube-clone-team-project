import type {
  Playlist,
} from '../../domain/playlist/types'
import type {
  PlaylistGateway,
  SavePlaylistRequest,
} from './gateway'

export interface PlaylistService {
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

  addVideo(
    playlistId: string,
    videoId: string,
  ): Promise<void>

  removeVideo(
    playlistId: string,
    videoId: string,
  ): Promise<void>
}

export function createPlaylistService(
  gateway: PlaylistGateway,
): PlaylistService {
  return {
    list:
      gateway.list,

    create:
      gateway.create,

    update:
      gateway.update,

    delete:
      gateway.delete,

    addVideo:
      gateway.addVideo,

    removeVideo:
      gateway.removeVideo,
  }
}
