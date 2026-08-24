import {
  createDiscoveryService,
} from '../application/discovery/service'
import {
  createVideoService,
} from '../application/video/service'
import {
  createStreamService,
} from '../application/stream/service'
import {
  discoveryGateway,
} from '../infrastructure/api/discovery'
import {
  videoGateway,
} from '../infrastructure/api/videos'
import {
  streamGateway,
} from '../infrastructure/api/streams'

export const discoveryService =
  createDiscoveryService(
    discoveryGateway,
  )

export const videoService =
  createVideoService(
    videoGateway,
  )
export const streamService =
  createStreamService(
    streamGateway,
  )
