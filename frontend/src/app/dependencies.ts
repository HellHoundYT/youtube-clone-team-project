import {
  createAuthService,
} from '../application/auth/service'
import {
  createDiscoveryService,
} from '../application/discovery/service'
import {
  createLibraryService,
} from '../application/library/service'
import {
  createStreamService,
} from '../application/stream/service'
import {
  createUploadService,
} from '../application/upload/service'
import {
  createVideoService,
} from '../application/video/service'
import { createChannelService } from '../application/channel/service'
import {
  authGateway,
} from '../infrastructure/api/auth'
import {
  discoveryGateway,
} from '../infrastructure/api/discovery'
import {
  libraryGateway,
} from '../infrastructure/api/library'
import {
  streamGateway,
} from '../infrastructure/api/streams'
import {
  uploadGateway,
} from '../infrastructure/api/upload'
import {
  videoGateway,
} from '../infrastructure/api/videos'
import { channelGateway } from '../infrastructure/api/channels'
import {
  liveChatClientFactory as signalRLiveChatClientFactory,
} from '../infrastructure/signalr/liveChat'
import {
  watchPartyClientFactory as signalRWatchPartyClientFactory,
} from '../infrastructure/signalr/watchParty'
import {
  liveChatSessionStore as browserLiveChatSessionStore,
} from '../infrastructure/storage/liveChatSession'
import {
  watchPartySessionStore as browserWatchPartySessionStore,
} from '../infrastructure/storage/watchPartySession'

export const authService =
  createAuthService(
    authGateway,
  )

export const discoveryService =
  createDiscoveryService(
    discoveryGateway,
  )

export const libraryService =
  createLibraryService(
    libraryGateway,
  )

export const streamService =
  createStreamService(
    streamGateway,
  )

export const uploadService =
  createUploadService(
    uploadGateway,
  )

export const videoService =
  createVideoService(
    videoGateway,
  )

export const channelService = createChannelService(channelGateway)

export const liveChatClientFactory =
  signalRLiveChatClientFactory

export const liveChatSessionStore =
  browserLiveChatSessionStore

export const watchPartyClientFactory =
  signalRWatchPartyClientFactory

export const watchPartySessionStore =
  browserWatchPartySessionStore
