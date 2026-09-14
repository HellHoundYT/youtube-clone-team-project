import type {
  Channel,
  SaveChannelRequest,
} from '../../domain/channel/types'

export interface ChannelGateway {
  listChannels(): Promise<Channel[]>

  getChannel(
    channelId: string,
  ): Promise<Channel>

  getMyChannel(): Promise<Channel>

  createChannel(
    request: SaveChannelRequest,
  ): Promise<Channel>

  updateChannel(
    channelId: string,
    request: SaveChannelRequest,
  ): Promise<Channel>

  listSubscriptions(): Promise<Channel[]>

  subscribe(
    channelId: string,
  ): Promise<void>

  unsubscribe(
    channelId: string,
  ): Promise<void>
}
