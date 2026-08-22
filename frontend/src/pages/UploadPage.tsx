import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadVideo } from '../api/videos'
import './UploadPage.css'

const categories = [
  'Music',
  'Games',
  'Cybersport',
  'Education',
  'Programming',
  'Films',
  'Podcasts',
  'Mixes',
]

function readVideoDuration(
  file: File,
): Promise<number> {
  return new Promise(
    (resolve, reject) => {
      const objectUrl =
        URL.createObjectURL(file)

      const video =
        document.createElement(
          'video',
        )

      const cleanUp = () => {
        URL.revokeObjectURL(
          objectUrl,
        )
      }

      video.preload =
        'metadata'

      video.onloadedmetadata =
        () => {
          const duration =
            Math.ceil(
              video.duration,
            )

          cleanUp()

          if (
            !Number.isFinite(
              duration,
            ) ||
            duration < 1
          ) {
            reject(
              new Error(
                'Invalid video duration.',
              ),
            )

            return
          }

          resolve(duration)
        }

      video.onerror =
        () => {
          cleanUp()

          reject(
            new Error(
              'Video metadata could not be read.',
            ),
          )
        }

      video.src =
        objectUrl
    },
  )
}

function formatDuration(
  seconds: number,
) {
  const minutes =
    Math.floor(
      seconds / 60,
    )

  const remainingSeconds =
    seconds % 60

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`
}

function UploadPage() {
  const navigate =
    useNavigate()

  const [
    title,
    setTitle,
  ] = useState('')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    category,
    setCategory,
  ] = useState(
    'Games',
  )

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    )

  const [
    durationSeconds,
    setDurationSeconds,
  ] = useState(0)

  const [
    progress,
    setProgress,
  ] = useState(0)

  const [
    isUploading,
    setIsUploading,
  ] = useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const handleFileChange =
    async (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const selectedFile =
        event.target.files?.[0] ??
        null

      setError(null)
      setProgress(0)
      setDurationSeconds(0)
      setFile(null)

      if (!selectedFile) {
        return
      }

      if (
        !selectedFile.name
          .toLowerCase()
          .endsWith('.mp4')
      ) {
        setError(
          'Choose an MP4 video file.',
        )

        event.target.value =
          ''

        return
      }

      try {
        const duration =
          await readVideoDuration(
            selectedFile,
          )

        setFile(
          selectedFile,
        )

        setDurationSeconds(
          duration,
        )

        if (
          !title.trim()
        ) {
          setTitle(
            selectedFile.name.replace(
              /\.mp4$/i,
              '',
            ),
          )
        }
      } catch {
        setError(
          'The selected MP4 could not be read.',
        )

        event.target.value =
          ''
      }
    }

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      if (
        isUploading
      ) {
        return
      }

      if (!file) {
        setError(
          'Choose a video file first.',
        )

        return
      }

      if (
        !title.trim()
      ) {
        setError(
          'Enter a video title.',
        )

        return
      }

      if (
        durationSeconds < 1
      ) {
        setError(
          'Video duration could not be determined.',
        )

        return
      }

      try {
        setError(null)
        setProgress(0)
        setIsUploading(true)

        const video =
          await uploadVideo(
            {
              title:
                title.trim(),
              description:
                description.trim(),
              category,
              durationSeconds,
              file,
            },
            setProgress,
          )

        navigate(
          `/watch/${video.id}`,
        )
      } catch {
        setError(
          'Video upload failed. Check that the API is running and try again.',
        )
      } finally {
        setIsUploading(
          false,
        )
      }
    }

  return (
    <section className="upload-page">
      <div className="upload-page-heading">
        <span>
          CREATOR STUDIO
        </span>

        <h1>
          Upload video
        </h1>

        <p>
          Upload an MP4 and publish it
          directly to the AMTLIS video
          catalogue.
        </p>
      </div>

      <form
        className="upload-form"
        onSubmit={
          handleSubmit
        }
      >
        <div className="upload-file-card">
          <div className="upload-file-icon">
            ↑
          </div>

          <strong>
            Select your video
          </strong>

          <span>
            MP4, maximum 500 MB
          </span>

          <label className="upload-file-button">
            Choose file

            <input
              type="file"
              accept="video/mp4,.mp4"
              disabled={
                isUploading
              }
              onChange={
                handleFileChange
              }
            />
          </label>

          {file && (
            <div className="upload-selected-file">
              <strong>
                {file.name}
              </strong>

              <span>
                {(
                  file.size /
                  1024 /
                  1024
                ).toFixed(1)}{' '}
                MB ·{' '}
                {formatDuration(
                  durationSeconds,
                )}
              </span>
            </div>
          )}
        </div>

        <div className="upload-fields">
          <label className="upload-field">
            <span>
              Title
            </span>

            <input
              type="text"
              maxLength={200}
              value={title}
              disabled={
                isUploading
              }
              placeholder="Video title"
              onChange={(event) =>
                setTitle(
                  event.target
                    .value,
                )
              }
            />
          </label>

          <label className="upload-field">
            <span>
              Category
            </span>

            <select
              value={
                category
              }
              disabled={
                isUploading
              }
              onChange={(event) =>
                setCategory(
                  event.target
                    .value,
                )
              }
            >
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="upload-field">
            <span>
              Description
            </span>

            <textarea
              maxLength={5000}
              rows={7}
              value={
                description
              }
              disabled={
                isUploading
              }
              placeholder="Tell viewers about this video"
              onChange={(event) =>
                setDescription(
                  event.target
                    .value,
                )
              }
            />
          </label>

          {error && (
            <div className="upload-error">
              {error}
            </div>
          )}

          {isUploading && (
            <div className="upload-progress">
              <div className="upload-progress-copy">
                <span>
                  Uploading...
                </span>

                <strong>
                  {progress}%
                </strong>
              </div>

              <div className="upload-progress-track">
                <span
                  style={{
                    width:
                      `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="upload-submit-button"
            disabled={
              isUploading ||
              !file
            }
          >
            {isUploading
              ? 'Uploading...'
              : 'Publish video'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default UploadPage