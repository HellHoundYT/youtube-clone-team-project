import type {
  Channel,
  SaveChannelRequest,
} from '../../domain/channel/types'
import type {
  ChannelGateway,
} from './gateway'

export interface ChannelService {
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

  uploadAvatar(
    channelId: string,
    file: File,
  ): Promise<Channel>

  uploadBanner(
    channelId: string,
    file: File,
  ): Promise<Channel>

  listSubscriptions(): Promise<Channel[]>

  subscribe(
    channelId: string,
  ): Promise<void>

  unsubscribe(
    channelId: string,
  ): Promise<void>
}

export function createChannelService(
  gateway: ChannelGateway,
): ChannelService {
  return {
    listChannels:
      gateway.listChannels,

    getChannel:
      gateway.getChannel,

    getMyChannel:
      gateway.getMyChannel,

    createChannel:
      gateway.createChannel,

    updateChannel:
      gateway.updateChannel,

    uploadAvatar:
      gateway.uploadAvatar,

    uploadBanner:
      gateway.uploadBanner,

    listSubscriptions:
      gateway.listSubscriptions,

    subscribe:
      gateway.subscribe,

    unsubscribe:
      gateway.unsubscribe,
  }
}
