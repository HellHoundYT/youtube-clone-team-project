import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import {
  uploadVideo,
} from '../api/videos'
import {
  useAppTranslation,
} from '../shared/i18n'
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
] as const

function readVideoDuration(
  file: File,
): Promise<number> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const objectUrl =
        URL.createObjectURL(
          file,
        )

      const video =
        document.createElement(
          'video',
        )

      const cleanUp =
        () => {
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

          resolve(
            duration,
          )
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
    .padStart(
      2,
      '0',
    )}`
}

function getLocale(
  language:
    | string
    | undefined,
) {
  return language
    ?.toLowerCase()
    .startsWith('uk')
    ? 'uk-UA'
    : 'en-US'
}

function formatMegabytes(
  bytes: number,
  locale: string,
) {
  return new Intl.NumberFormat(
    locale,
    {
      minimumFractionDigits:
        1,

      maximumFractionDigits:
        1,
    },
  ).format(
    bytes /
      1024 /
      1024,
  )
}

function UploadPage() {
  const navigate =
    useNavigate()

  const {
    t,
    i18n,
  } =
    useAppTranslation()

  const locale =
    getLocale(
      i18n.resolvedLanguage,
    )

  const [
    title,
    setTitle,
  ] =
    useState('')

  const [
    description,
    setDescription,
  ] =
    useState('')

  const [
    category,
    setCategory,
  ] =
    useState(
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
  ] =
    useState(0)

  const [
    progress,
    setProgress,
  ] =
    useState(0)

  const [
    isUploading,
    setIsUploading,
  ] =
    useState(false)

  const [
    errorKey,
    setErrorKey,
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
        event.target
          .files?.[0] ??
        null

      setErrorKey(
        null,
      )

      setProgress(
        0,
      )

      setDurationSeconds(
        0,
      )

      setFile(
        null,
      )

      if (!selectedFile) {
        return
      }

      if (
        !selectedFile.name
          .toLowerCase()
          .endsWith(
            '.mp4',
          )
      ) {
        setErrorKey(
          'upload.errors.chooseMp4',
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
        setErrorKey(
          'upload.errors.unreadableMp4',
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
        setErrorKey(
          'upload.errors.chooseFile',
        )

        return
      }

      if (
        !title.trim()
      ) {
        setErrorKey(
          'upload.errors.enterTitle',
        )

        return
      }

      if (
        durationSeconds <
        1
      ) {
        setErrorKey(
          'upload.errors.durationUnknown',
        )

        return
      }

      try {
        setErrorKey(
          null,
        )

        setProgress(
          0,
        )

        setIsUploading(
          true,
        )

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
        setErrorKey(
          'upload.errors.uploadFailed',
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
          {t(
            'upload.eyebrow',
          )}
        </span>

        <h1>
          {t(
            'upload.title',
          )}
        </h1>

        <p>
          {t(
            'upload.description',
          )}
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
            {t(
              'upload.selectVideo',
            )}
          </strong>

          <span>
            {t(
              'upload.fileHint',
            )}
          </span>

          <label className="upload-file-button">
            {t(
              'upload.chooseFile',
            )}

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
                {t(
                  'upload.fileMeta',
                  {
                    size:
                      formatMegabytes(
                        file.size,
                        locale,
                      ),

                    duration:
                      formatDuration(
                        durationSeconds,
                      ),
                  },
                )}
              </span>
            </div>
          )}
        </div>

        <div className="upload-fields">
          <label className="upload-field">
            <span>
              {t(
                'upload.titleLabel',
              )}
            </span>

            <input
              type="text"
              maxLength={
                200
              }
              value={
                title
              }
              disabled={
                isUploading
              }
              placeholder={t(
                'upload.titlePlaceholder',
              )}
              onChange={(
                event,
              ) =>
                setTitle(
                  event.target
                    .value,
                )
              }
            />
          </label>

          <label className="upload-field">
            <span>
              {t(
                'upload.categoryLabel',
              )}
            </span>

            <select
              value={
                category
              }
              disabled={
                isUploading
              }
              onChange={(
                event,
              ) =>
                setCategory(
                  event.target
                    .value,
                )
              }
            >
              {categories.map(
                (
                  item,
                ) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {t(
                      `upload.categories.${item.toLowerCase()}`,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="upload-field">
            <span>
              {t(
                'upload.descriptionLabel',
              )}
            </span>

            <textarea
              maxLength={
                5000
              }
              rows={
                7
              }
              value={
                description
              }
              disabled={
                isUploading
              }
              placeholder={t(
                'upload.descriptionPlaceholder',
              )}
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target
                    .value,
                )
              }
            />
          </label>

          {errorKey && (
            <div className="upload-error">
              {t(
                errorKey,
              )}
            </div>
          )}

          {isUploading && (
            <div className="upload-progress">
              <div className="upload-progress-copy">
                <span>
                  {t(
                    'upload.uploading',
                  )}
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
              ? t(
                  'upload.uploading',
                )
              : t(
                  'upload.publish',
                )}
          </button>
        </div>
      </form>
    </section>
  )
}

export default UploadPage
