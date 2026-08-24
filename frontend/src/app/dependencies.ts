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
import {
  liveChatClientFactory as signalRLiveChatClientFactory,
} from '../infrastructure/signalr/liveChat'

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

export const liveChatClientFactory =
  signalRLiveChatClientFactory
