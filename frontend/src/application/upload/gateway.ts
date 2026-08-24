import type {
  VideoDetails,
} from '../../domain/video/types'
import type {
  UploadProgressHandler,
  UploadVideoRequest,
} from './types'

export interface UploadGateway {
  uploadVideo(
    request: UploadVideoRequest,
    onProgress?: UploadProgressHandler,
  ): Promise<VideoDetails>
}
