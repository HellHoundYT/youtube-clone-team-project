import {
  useEffect,
  useState,
} from 'react'
import {
  useSearchParams,
} from 'react-router-dom'
import {
  searchVideos,
} from '../api/discovery'
import type {
  VideoListItem,
} from '../api/videos'
import VideoGrid from '../components/video/VideoGrid'
import './DiscoveryPage.css'

interface SearchState {
  requestKey: string
  videos: VideoListItem[]
  error: boolean
}

function SearchPage() {
  const [searchParams] =
    useSearchParams()

  const query =
    (
      searchParams.get(
        'query',
      ) ?? ''
    ).trim()

  const [
    reloadToken,
    setReloadToken,
  ] = useState(0)

  const [
    state,
    setState,
  ] = useState<SearchState | null>(
    null,
  )

  const requestKey =
    `${query}:${reloadToken}`

  useEffect(() => {
    if (!query) {
      return
    }

    const controller =
      new AbortController()

    void searchVideos(
      query,
      controller.signal,
    )
      .then((response) => {
        if (
          controller.signal.aborted
        ) {
          return
        }

        setState({
          requestKey,
          videos:
            response.videos,
          error: false,
        })
      })
      .catch(() => {
        if (
          controller.signal.aborted
        ) {
          return
        }

        setState({
          requestKey,
          videos: [],
          error: true,
        })
      })

    return () => {
      controller.abort()
    }
  }, [
    query,
    reloadToken,
    requestKey,
  ])

  const isCurrentRequest =
    state?.requestKey ===
    requestKey

  const isLoading =
    Boolean(query) &&
    !isCurrentRequest

  const isError =
    isCurrentRequest &&
    state?.error === true

  const videos =
    isCurrentRequest &&
    !state?.error
      ? state?.videos ?? []
      : []

  return (
    <div className="discovery-page">
      <header className="discovery-header">
        <span className="discovery-eyebrow">
          SEARCH
        </span>

        <h1>
          Search results
        </h1>

        {query ? (
          <p>
            Results for{' '}
            <strong>
              “{query}”
            </strong>
          </p>
        ) : (
          <p>
            Enter a search query
            using the field above.
          </p>
        )}
      </header>

      {!query ? (
        <div className="discovery-state">
          <strong>
            Start searching
          </strong>

          <span>
            Search for videos,
            categories or channels
            from the header.
          </span>
        </div>
      ) : isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            Searching...
          </span>
        </div>
      ) : isError ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            Search failed
          </strong>

          <span>
            Make sure the backend
            is running and try
            again.
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
      ) : videos.length ===
        0 ? (
        <div className="discovery-state">
          <strong>
            Nothing found
          </strong>

          <span>
            No videos matched
            “{query}”.
          </span>
        </div>
      ) : (
        <>
          <div className="discovery-result-summary">
            {videos.length}{' '}
            {videos.length === 1
              ? 'video'
              : 'videos'}{' '}
            found
          </div>

          <VideoGrid
            videos={videos}
          />
        </>
      )}
    </div>
  )
}

export default SearchPage