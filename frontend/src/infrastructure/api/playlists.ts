import axios from 'axios'
import type {
  PlaylistGateway,
  SavePlaylistRequest,
} from '../../application/playlist/gateway'
import type {
  Playlist,
} from '../../domain/playlist/types'
import {
  createAuthorizedConfig,
  withAuthenticatedRequest,
} from './authSession'

export const playlistGateway:
PlaylistGateway = {
  async list() {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.get<Playlist[]>(
            '/api/v1/playlists',
            {
              withCredentials:
                true,
              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },

  async create(
    request:
      SavePlaylistRequest,
  ) {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.post<Playlist>(
            '/api/v1/playlists',
            request,
            {
              withCredentials:
                true,
              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },

  async update(
    playlistId,
    request,
  ) {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.put<Playlist>(
            `/api/v1/playlists/${encodeURIComponent(playlistId)}`,
            request,
            {
              withCredentials:
                true,
              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },

  async delete(
    playlistId,
  ) {
    await withAuthenticatedRequest(
      (token) =>
        axios.delete(
          `/api/v1/playlists/${encodeURIComponent(playlistId)}`,
          {
            withCredentials:
              true,
            ...createAuthorizedConfig(token),
          },
        ),
    )
  },
}
