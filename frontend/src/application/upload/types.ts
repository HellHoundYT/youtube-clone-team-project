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
  | 'requestFailed'

export class UploadFailure
  extends Error {
  constructor(
    public readonly code:
      UploadFailureCode,
    message?: string,
  ) {
    super(
      message ?? code,
    )

    this.name =
      'UploadFailure'
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
