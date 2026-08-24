// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import {
  MemoryRouter,
} from 'react-router-dom'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type {
  LibraryService,
} from '../application/library/service'
import HistoryPage from './HistoryPage'

const getWatchHistoryMock =
  vi.fn<LibraryService['getWatchHistory']>()

const getHistoryStatusMock =
  vi.fn<LibraryService['getHistoryStatus']>()

const clearWatchHistoryMock =
  vi.fn<LibraryService['clearWatchHistory']>()

const removeHistoryItemMock =
  vi.fn<LibraryService['removeHistoryItem']>()

const setHistoryPausedMock =
  vi.fn<LibraryService['setHistoryPaused']>()

const libraryService: LibraryService = {
  getWatchHistory:
    getWatchHistoryMock,

  updateWatchHistory:
    vi.fn<LibraryService['updateWatchHistory']>(),

  removeHistoryItem:
    removeHistoryItemMock,

  clearWatchHistory:
    clearWatchHistoryMock,

  getHistoryStatus:
    getHistoryStatusMock,

  setHistoryPaused:
    setHistoryPausedMock,

  getFavorites:
    vi.fn<LibraryService['getFavorites']>(),

  addFavorite:
    vi.fn<LibraryService['addFavorite']>(),

  removeFavorite:
    vi.fn<LibraryService['removeFavorite']>(),
}
function renderHistoryPage() {
  return render(
    <MemoryRouter>
      <HistoryPage libraryService={libraryService} />
    </MemoryRouter>,
  )
}

describe(
  'HistoryPage',
  () => {
    beforeEach(() => {
      getHistoryStatusMock
        .mockResolvedValue({
          isPaused: false,
        })

      clearWatchHistoryMock
        .mockResolvedValue()

      removeHistoryItemMock
        .mockResolvedValue()

      setHistoryPausedMock
        .mockResolvedValue({
          isPaused: false,
        })
    })

    afterEach(() => {
      cleanup()
      vi.clearAllMocks()
    })

    it(
      'shows the loading state while history is being requested',
      () => {
        getWatchHistoryMock
          .mockImplementation(
            () =>
              new Promise(
                () => {
                  // Intentionally pending.
                },
              ),
          )

        renderHistoryPage()

        expect(
          screen.getByText(
            'Loading history...',
          ),
        ).toBeTruthy()
      },
    )

    it(
      'shows the error state when history loading fails',
      async () => {
        getWatchHistoryMock
          .mockRejectedValue(
            new Error(
              'Backend unavailable',
            ),
          )

        renderHistoryPage()

        expect(
          await screen.findByText(
            'History failed to load',
          ),
        ).toBeTruthy()

        expect(
          screen.getByRole(
            'button',
            {
              name:
                'Try again',
            },
          ),
        ).toBeTruthy()
      },
    )

    it(
      'renders history data and opens the custom clear confirmation modal',
      async () => {
        getWatchHistoryMock
          .mockResolvedValue([
            {
              videoId:
                '11111111-1111-1111-1111-111111111111',
              progressSeconds:
                42,
              completed:
                false,
              lastWatchedAt:
                '2026-08-23T05:00:00Z',
              video: {
                id:
                  '11111111-1111-1111-1111-111111111111',
                channelId:
                  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                channelName:
                  'AMTLIS Music',
                channelAvatarPath:
                  null,
                category:
                  'Music',
                categorySlug:
                  'music',
                title:
                  'Midnight City',
                thumbnailPath:
                  '/demo/thumbnails/midnight-city.webp',
                durationSeconds:
                  131,
                viewCount:
                  2400000,
                publishedAt:
                  '2026-08-08T18:00:00Z',
              },
            },
          ])

        renderHistoryPage()

        expect(
          await screen.findByText(
            'Midnight City',
          ),
        ).toBeTruthy()

        expect(
          screen.getByText(
            '0:42 watched',
          ),
        ).toBeTruthy()

        const clearButton =
          screen.getByRole(
            'button',
            {
              name:
                'Clear history',
            },
          )

        fireEvent.click(
          clearButton,
        )

        expect(
          screen.getByRole(
            'dialog',
          ),
        ).toBeTruthy()

        expect(
          screen.getByText(
            'Clear watch history?',
          ),
        ).toBeTruthy()

        fireEvent.click(
          screen.getByRole(
            'button',
            {
              name:
                'Cancel',
            },
          ),
        )

        expect(
          screen.queryByRole(
            'dialog',
          ),
        ).toBeNull()
      },
    )
  },
)
