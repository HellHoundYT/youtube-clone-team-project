import {
  createDiscoveryService,
} from '../application/discovery/service'
import {
  createVideoService,
} from '../application/video/service'
import {
  discoveryGateway,
} from '../infrastructure/api/discovery'
import {
  videoGateway,
} from '../infrastructure/api/videos'

export const discoveryService =
  createDiscoveryService(
    discoveryGateway,
  )

export const videoService =
  createVideoService(
    videoGateway,
  )
