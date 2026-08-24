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
  videoGateway,
} from '../infrastructure/api/videos'

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

export const videoService =
  createVideoService(
    videoGateway,
  )
