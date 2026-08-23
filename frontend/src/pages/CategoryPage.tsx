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
import './DiscoveryPage.css'

interface CategoryState {
  requestKey: string
  categories: Category[]
  currentCategory:
    Category | null
  videos: VideoListItem[]
  error: boolean
}

function CategoryPage() {
  const navigate =
    useNavigate()

  const {
    slug = '',
  } = useParams<{
    slug: string
  }>()

  const normalizedSlug =
    slug
      .trim()
      .toLowerCase()

  const [
    reloadToken,
    setReloadToken,
  ] = useState(0)

  const [
    state,
    setState,
  ] = useState<CategoryState | null>(
    null,
  )

  const requestKey =
    `${normalizedSlug}:${reloadToken}`

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
          controller.signal.aborted
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
      ? state?.categories ?? []
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
          All
        </button>

        {categories.map(
          (category) => (
            <button
              key={category.slug}
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
              {category.name}
            </button>
          ),
        )}
      </div>

      {isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            Loading category...
          </span>
        </div>
      ) : isError ||
        !currentCategory ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            Category unavailable
          </strong>

          <span>
            This category does
            not exist or could
            not be loaded.
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
            Try again
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
              CATEGORY
            </span>

            <h1>
              {
                currentCategory
                  .name
              }
            </h1>

            <p>
              Explore videos in{' '}
              {
                currentCategory
                  .name
              }.
            </p>
          </header>

          {videos.length ===
          0 ? (
            <div className="discovery-state">
              <strong>
                No videos yet
              </strong>

              <span>
                There are no
                published videos
                in this category.
              </span>
            </div>
          ) : (
            <>
              <div className="discovery-result-summary">
                {videos.length}{' '}
                {videos.length ===
                1
                  ? 'video'
                  : 'videos'}
              </div>

              <VideoGrid
                videos={videos}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

export default CategoryPage