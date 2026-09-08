import type { Channel } from '../../domain/channel/types'
import type { ChannelGateway } from './gateway'
export interface ChannelService { getChannel(channelId: string): Promise<Channel> }
export const createChannelService = (gateway: ChannelGateway): ChannelService => ({ getChannel: gateway.getChannel })
