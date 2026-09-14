import axios from 'axios'
import type {
  ChannelGateway,
} from '../../application/channel/gateway'
import type {
  Channel,
  SaveChannelRequest,
} from '../../domain/channel/types'
import {
  createAuthorizedConfig,
  withAuthenticatedRequest,
} from './authSession'

export const channelGateway:
ChannelGateway = {
  async listChannels() {
    const response =
      await axios.get<Channel[]>(
        '/api/v1/channels',
      )

    return response.data
  },

  async getChannel(
    channelId,
  ) {
    const response =
      await axios.get<Channel>(
        `/api/v1/channels/${channelId}`,
      )

    return response.data
  },

  async getMyChannel() {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.get<Channel>(
            '/api/v1/channels/me',
            {
              withCredentials:
                true,

              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },

  async createChannel(
    request:
      SaveChannelRequest,
  ) {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.post<Channel>(
            '/api/v1/channels',
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

  async updateChannel(
    channelId,
    request,
  ) {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.put<Channel>(
            `/api/v1/channels/${channelId}`,
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

  async listSubscriptions() {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.get<Channel[]>(
            '/api/v1/channels/subscriptions',
            {
              withCredentials:
                true,

              ...createAuthorizedConfig(token),
            },
          ),
      )

    return response.data
  },

  async subscribe(
    channelId,
  ) {
    await withAuthenticatedRequest(
      (token) =>
        axios.post(
          `/api/v1/channels/${channelId}/subscribe`,
          undefined,
          {
            withCredentials:
              true,

            ...createAuthorizedConfig(token),
          },
        ),
    )
  },

  async unsubscribe(
    channelId,
  ) {
    await withAuthenticatedRequest(
      (token) =>
        axios.delete(
          `/api/v1/channels/${channelId}/subscribe`,
          {
            withCredentials:
              true,

            ...createAuthorizedConfig(token),
          },
        ),
    )
  },
}
