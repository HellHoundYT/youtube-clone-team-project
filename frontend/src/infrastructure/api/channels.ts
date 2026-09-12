import axios from 'axios'
import {
  getAuthenticatedConfig,
} from './auth'

export interface ApiChannel {
  id: string
  name: string
  handle: string
  description: string
  avatarPath: string | null
  bannerPath: string | null
  subscriberCount: number
}

export const channelsApi = {
  async list() {
    const response = await axios.get<ApiChannel[]>('/api/v1/channels')
    return response.data
  },

  async get(channelId: string) {
    const response = await axios.get<ApiChannel>(`/api/v1/channels/${channelId}`)
    return response.data
  },

  async subscriptions() {
    const response = await axios.get<ApiChannel[]>('/api/v1/channels/subscriptions', {
      ...getAuthenticatedConfig(),
    })
    return response.data
  },

  async subscribe(channelId: string) {
    await axios.post(`/api/v1/channels/${channelId}/subscribe`, null, {
      ...getAuthenticatedConfig(),
    })
  },

  async unsubscribe(channelId: string) {
    await axios.delete(`/api/v1/channels/${channelId}/subscribe`, {
      ...getAuthenticatedConfig(),
    })
  },
}
