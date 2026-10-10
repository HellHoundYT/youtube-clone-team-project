import axios, {
  type AxiosProgressEvent,
} from 'axios'
import type {
  UploadGateway,
} from '../../application/upload/gateway'
import {
  UploadFailure,
  type UploadProgressHandler,
  type UploadVideoRequest,
} from '../../application/upload/types'
import type {
  VideoDetails,
} from '../../domain/video/types'
import {
  createAuthorizedConfig,
  withAuthenticatedRequest,
} from './authSession'

function getServerMessage(
  value: unknown,
) {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('message' in value)
  ) {
    return ''
  }

  const message =
    (value as {
      message?: unknown
    }).message

  return typeof message ===
    'string'
    ? message
    : ''
}

function mapUploadFailure(
  error: unknown,
): UploadFailure {
  if (!axios.isAxiosError(error)) {
    return new UploadFailure(
      'requestFailed',
    )
  }

  const status =
    error.response?.status

  const message =
    getServerMessage(
      error.response?.data,
    )

  const normalizedMessage =
    message.toLowerCase()

  if (
    status === 401 ||
    status === 403
  ) {
    return new UploadFailure(
      'unauthorized',
      message,
    )
  }

  if (
    status === 413 ||
    normalizedMessage.includes(
      '500 mb',
    )
  ) {
    return new UploadFailure(
      'fileTooLarge',
      message,
    )
  }

  if (
    normalizedMessage.includes(
      'thumbnail',
    ) &&
    normalizedMessage.includes(
      '10 mb',
    )
  ) {
    return new UploadFailure(
      'thumbnailTooLarge',
      message,
    )
  }

  if (
    normalizedMessage.includes(
      'thumbnail',
    )
  ) {
    return new UploadFailure(
      'invalidThumbnail',
      message,
    )
  }

  if (
    normalizedMessage.includes(
      'only mp4',
    )
  ) {
    return new UploadFailure(
      'chooseMp4',
      message,
    )
  }

  if (
    status === 503 &&
    normalizedMessage.includes(
      'timed out',
    )
  ) {
    return new UploadFailure(
      'analysisTimeout',
      message,
    )
  }

  if (status === 503) {
    return new UploadFailure(
      'analysisUnavailable',
      message,
    )
  }

  if (
    status === 400 &&
    (
      normalizedMessage.includes(
        'invalid',
      ) ||
      normalizedMessage.includes(
        'video analysis',
      )
    )
  ) {
    return new UploadFailure(
      'invalidVideo',
      message,
    )
  }

  return new UploadFailure(
    'requestFailed',
    message,
  )
}

export async function uploadVideo(
  request: UploadVideoRequest,
  onProgress?: UploadProgressHandler,
): Promise<VideoDetails> {
  const nativeFile =
    request.source.native

  if (!(nativeFile instanceof File)) {
    throw new UploadFailure(
      'requestFailed',
      'Upload source is not a browser File.',
    )
  }

  const thumbnailFile =
    request.thumbnail?.native

  if (
    thumbnailFile !== undefined &&
    thumbnailFile !== null &&
    !(thumbnailFile instanceof File)
  ) {
    throw new UploadFailure(
      'invalidThumbnail',
      'Thumbnail source is not a browser File.',
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

  if (
    thumbnailFile instanceof File
  ) {
    formData.append(
      'thumbnail',
      thumbnailFile,
    )
  }

  try {
    const response =
      await withAuthenticatedRequest(
        (token) =>
          axios.post<VideoDetails>(
            '/api/v1/videos/upload',
            formData,
            {
              withCredentials:
                true,

              ...createAuthorizedConfig(token),

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
          ),
      )

    return response.data
  } catch (error) {
    if (
      error instanceof
      UploadFailure
    ) {
      throw error
    }

    throw mapUploadFailure(
      error,
    )
  }
}

export const uploadGateway:
UploadGateway = {
  uploadVideo,
}
