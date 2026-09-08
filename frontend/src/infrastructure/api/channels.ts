import axios from 'axios'
import type { ChannelGateway } from '../../application/channel/gateway'
import type { Channel } from '../../domain/channel/types'
export const channelGateway: ChannelGateway = { async getChannel(channelId: string): Promise<Channel> { return (await axios.get<Channel>(`/api/v1/channels/${channelId}`)).data } }
