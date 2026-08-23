import {
  useEffect,
  useState,
} from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  getCategories,
  getCategoryVideos,
  type Category,
} from '../api/discovery'
import type {
  VideoListItem,
} from '../api/videos'
import VideoGrid from '../components/video/VideoGrid'
import {
  useAppTranslation,
} from '../i18n'
import './DiscoveryPage.css'

interface CategoryState {
  requestKey: string
  categories: Category[]
  currentCategory:
    Category | null
  videos: VideoListItem[]
  error: boolean
}

const categoryTranslationKeys:
Record<string, string> = {
  music:
    'common.category.music',

  games:
    'common.category.games',

  cybersport:
    'common.category.cybersport',

  education:
    'common.category.education',

  films:
    'common.category.films',

  podcasts:
    'common.category.podcasts',

  mixes:
    'common.category.mixes',
}

function CategoryPage() {
  const navigate =
    useNavigate()

  const {
    t,
  } =
    useAppTranslation()

  const {
    slug = '',
  } =
    useParams<{
      slug: string
    }>()

  const normalizedSlug =
    slug
      .trim()
      .toLowerCase()

  const [
    reloadToken,
    setReloadToken,
  ] =
    useState(0)

  const [
    state,
    setState,
  ] =
    useState<CategoryState | null>(
      null,
    )

  const requestKey =
    `${normalizedSlug}:${reloadToken}`

  const getCategoryLabel = (
    category: Category,
  ) => {
    const key =
      categoryTranslationKeys[
        category.slug
          .toLowerCase()
      ]

    return key
      ? t(key)
      : category.name
  }

  useEffect(() => {
    const controller =
      new AbortController()

    void Promise.all([
      getCategories(
        controller.signal,
      ),

      getCategoryVideos(
        normalizedSlug,
        {
          page: 1,
          pageSize: 50,
        },
        controller.signal,
      ),
    ])
      .then(
        ([
          categories,
          videos,
        ]) => {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          const currentCategory =
            categories.find(
              (category) =>
                category.slug ===
                normalizedSlug,
            ) ?? null

          setState({
            requestKey,
            categories,
            currentCategory,
            videos,

            error:
              currentCategory ===
              null,
          })
        },
      )
      .catch(() => {
        if (
          controller.signal
            .aborted
        ) {
          return
        }

        setState({
          requestKey,
          categories: [],
          currentCategory: null,
          videos: [],
          error: true,
        })
      })

    return () => {
      controller.abort()
    }
  }, [
    normalizedSlug,
    reloadToken,
    requestKey,
  ])

  const isCurrentRequest =
    state?.requestKey ===
    requestKey

  const isLoading =
    !isCurrentRequest

  const isError =
    isCurrentRequest &&
    state?.error === true

  const categories =
    isCurrentRequest
      ? state?.categories ??
        []
      : []

  const currentCategory =
    isCurrentRequest &&
    !state?.error
      ? state?.currentCategory ??
        null
      : null

  const videos =
    isCurrentRequest &&
    !state?.error
      ? state?.videos ?? []
      : []

  const currentCategoryLabel =
    currentCategory
      ? getCategoryLabel(
          currentCategory,
        )
      : ''

  return (
    <div className="discovery-page">
      <div className="category-strip discovery-category-strip">
        <button
          type="button"
          className="category-chip"
          onClick={() =>
            navigate('/')
          }
        >
          {t(
            'categoryPage.all',
          )}
        </button>

        {categories.map(
          (category) => (
            <button
              key={
                category.slug
              }
              type="button"
              className={`category-chip ${
                category.slug ===
                normalizedSlug
                  ? 'is-active'
                  : ''
              }`}
              onClick={() =>
                navigate(
                  `/categories/${category.slug}`,
                )
              }
            >
              {getCategoryLabel(
                category,
              )}
            </button>
          ),
        )}
      </div>

      {isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            {t(
              'categoryPage.loading',
            )}
          </span>
        </div>
      ) : isError ||
        !currentCategory ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            {t(
              'categoryPage.unavailable',
            )}
          </strong>

          <span>
            {t(
              'categoryPage.unavailableHint',
            )}
          </span>

          <button
            type="button"
            onClick={() =>
              setReloadToken(
                (value) =>
                  value + 1,
              )
            }
          >
            {t(
              'common.retry',
            )}
          </button>
        </div>
      ) : (
        <>
          <header
            className="discovery-header category-page-header"
            data-category={
              normalizedSlug
            }
          >
            <span className="discovery-eyebrow">
              {t(
                'categoryPage.eyebrow',
              )}
            </span>

            <h1>
              {
                currentCategoryLabel
              }
            </h1>

            <p>
              {t(
                'categoryPage.explore',
                {
                  category:
                    currentCategoryLabel,
                },
              )}
            </p>
          </header>

          {videos.length ===
          0 ? (
            <div className="discovery-state">
              <strong>
                {t(
                  'categoryPage.noVideos',
                )}
              </strong>

              <span>
                {t(
                  'categoryPage.noVideosHint',
                )}
              </span>
            </div>
          ) : (
            <>
              <div className="discovery-result-summary">
                {t(
                  'categoryPage.video',
                  {
                    count:
                      videos.length,
                  },
                )}
              </div>

              <VideoGrid
                videos={
                  videos
                }
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

export default CategoryPage
