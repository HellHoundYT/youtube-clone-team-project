import {
  createDiscoveryService,
} from '../application/discovery/service'
import {
  discoveryGateway,
} from '../infrastructure/api/discovery'

export const discoveryService =
  createDiscoveryService(
    discoveryGateway,
  )
