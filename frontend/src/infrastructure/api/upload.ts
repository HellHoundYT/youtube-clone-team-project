import axios, {
  type AxiosProgressEvent,
} from 'axios'
import type {
  UploadGateway,
} from '../../application/upload/gateway'
import type {
  UploadProgressHandler,
  UploadVideoRequest,
} from '../../application/upload/types'
import type {
  VideoDetails,
} from '../../domain/video/types'

export async function uploadVideo(
  request: UploadVideoRequest,
  onProgress?: UploadProgressHandler,
): Promise<VideoDetails> {
  const nativeFile =
    request.source.native

  if (!(nativeFile instanceof File)) {
    throw new TypeError(
      'Upload source is not a browser File.',
    )
  }

  const formData =
    new FormData()

  formData.append(
    'title',
    request.title,
  )

  formData.append(
    'description',
    request.description,
  )

  formData.append(
    'category',
    request.category,
  )

  formData.append(
    'durationSeconds',
    request.durationSeconds.toString(),
  )

  formData.append(
    'file',
    nativeFile,
  )

  const response =
    await axios.post<VideoDetails>(
      '/api/v1/videos/upload',
      formData,
      {
        onUploadProgress: (
          event:
            AxiosProgressEvent,
        ) => {
          if (!event.total) {
            return
          }

          const progress =
            Math.round(
              (
                event.loaded /
                event.total
              ) * 100,
            )

          onProgress?.(
            Math.min(
              progress,
              100,
            ),
          )
        },
      },
    )

  return response.data
}

export const uploadGateway:
UploadGateway = {
  uploadVideo,
}
