import type {
  VideoDetails,
} from '../../domain/video/types'
import type {
  UploadGateway,
} from './gateway'
import type {
  UploadProgressHandler,
  UploadVideoRequest,
} from './types'

export interface UploadService {
  uploadVideo(
    request: UploadVideoRequest,
    onProgress?: UploadProgressHandler,
  ): Promise<VideoDetails>
}

export function createUploadService(
  gateway: UploadGateway,
): UploadService {
  return {
    uploadVideo:
      gateway.uploadVideo,
  }
}
