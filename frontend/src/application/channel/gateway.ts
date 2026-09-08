import type { Channel } from '../../domain/channel/types'
export interface ChannelGateway { getChannel(channelId: string): Promise<Channel> }
