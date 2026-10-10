export interface UploadSource {
  name: string
  size: number
  native: unknown
}

export type UploadFailureCode =
  | 'unauthorized'
  | 'fileTooLarge'
  | 'chooseMp4'
  | 'invalidVideo'
  | 'analysisUnavailable'
  | 'analysisTimeout'
  | 'invalidThumbnail'
  | 'thumbnailTooLarge'
  | 'requestFailed'

export class UploadFailure
  extends Error {
  readonly code:
    UploadFailureCode

  constructor(
    code: UploadFailureCode,
    message?: string,
  ) {
    super(
      message ?? code,
    )

    this.name =
      'UploadFailure'

    this.code =
      code
  }
}

export interface UploadVideoRequest {
  title: string
  description: string
  category: string
  durationSeconds: number
  source: UploadSource
  thumbnail?: UploadSource | null
}

export type UploadProgressHandler = (
  progress: number,
) => void
