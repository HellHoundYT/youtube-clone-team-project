export interface UploadSource {
  name: string
  size: number
  native: unknown
}

export interface UploadVideoRequest {
  title: string
  description: string
  category: string
  durationSeconds: number
  source: UploadSource
}

export type UploadProgressHandler = (
  progress: number,
) => void
