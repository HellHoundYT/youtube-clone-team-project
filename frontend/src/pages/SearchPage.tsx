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
import {
  useAppTranslation,
} from '../i18n'
import './DiscoveryPage.css'

interface SearchState {
  requestKey: string
  videos: VideoListItem[]
  error: boolean
}

function SearchPage() {
  const [
    searchParams,
  ] =
    useSearchParams()

  const {
    t,
  } =
    useAppTranslation()

  const query =
    (
      searchParams.get(
        'query',
      ) ?? ''
    ).trim()

  const [
    reloadToken,
    setReloadToken,
  ] =
    useState(0)

  const [
    state,
    setState,
  ] =
    useState<SearchState | null>(
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
      .then(
        (response) => {
          if (
            controller.signal
              .aborted
          ) {
            return
          }

          setState({
            requestKey,

            videos:
              response.videos,

            error:
              false,
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
          {t(
            'searchPage.eyebrow',
          )}
        </span>

        <h1>
          {t(
            'searchPage.title',
          )}
        </h1>

        {query ? (
          <p>
            {t(
              'searchPage.resultsFor',
              {
                query,
              },
            )}
          </p>
        ) : (
          <p>
            {t(
              'searchPage.enterQuery',
            )}
          </p>
        )}
      </header>

      {!query ? (
        <div className="discovery-state">
          <strong>
            {t(
              'searchPage.startSearching',
            )}
          </strong>

          <span>
            {t(
              'searchPage.startSearchingHint',
            )}
          </span>
        </div>
      ) : isLoading ? (
        <div className="discovery-state">
          <div className="discovery-spinner" />

          <span>
            {t(
              'searchPage.searching',
            )}
          </span>
        </div>
      ) : isError ? (
        <div className="discovery-state discovery-state-error">
          <strong>
            {t(
              'searchPage.failed',
            )}
          </strong>

          <span>
            {t(
              'searchPage.backendHint',
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
      ) : videos.length ===
        0 ? (
        <div className="discovery-state">
          <strong>
            {t(
              'searchPage.nothingFound',
            )}
          </strong>

          <span>
            {t(
              'searchPage.noMatch',
              {
                query,
              },
            )}
          </span>
        </div>
      ) : (
        <>
          <div className="discovery-result-summary">
            {t(
              'searchPage.found',
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
    </div>
  )
}

export default SearchPage
