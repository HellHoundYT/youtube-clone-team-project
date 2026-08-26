import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import {
  useEffect,
} from 'react'
import AppLayout from '../presentation/components/layout/AppLayout'
import AuthPage from '../presentation/pages/AuthPage'
import ChannelPage from '../presentation/pages/ChannelPage'
import CategoryPage from '../presentation/pages/CategoryPage'
import FavoritesPage from '../presentation/pages/FavoritesPage'
import HistoryPage from '../presentation/pages/HistoryPage'
import HomePage from '../presentation/pages/HomePage'
import LibraryPage from '../presentation/pages/LibraryPage'
import LiveStreamPage from '../presentation/pages/LiveStreamPage'
import PlaymePage from '../presentation/pages/PlaymePage'
import PlaylistsPage from '../presentation/pages/PlaylistsPage'
import ProfilePage from '../presentation/pages/ProfilePage'
import SearchPage from '../presentation/pages/SearchPage'
import StreamsPage from '../presentation/pages/StreamsPage'
import SubscriptionsPage from '../presentation/pages/SubscriptionsPage'
import ThemesPage from '../presentation/pages/ThemesPage'
import UploadPage from '../presentation/pages/UploadPage'
import WatchPage from '../presentation/pages/WatchPage'
import WatchPartyPage from '../presentation/pages/WatchPartyPage'
import './App.css'
import '../shared/theme/theme-runtime.css'
import {
  useAuthStore,
} from '../presentation/features/auth/authStore'
import {
  discoveryService,
  videoService,
  streamService,
  libraryService,
  uploadService,
  liveChatClientFactory,
  liveChatSessionStore,
  watchPartyClientFactory,
  watchPartySessionStore,
} from './dependencies'

function App() {
  const loadCurrentUser =
    useAuthStore((state) => state.loadCurrentUser)

  useEffect(() => {
    void loadCurrentUser()
  }, [loadCurrentUser])

  return (
    <Routes>
      <Route
        element={
          <AppLayout />
        }
      >
        <Route
          index
          element={
            <HomePage libraryService={libraryService} videoService={videoService} />
          }
        />

        <Route
          path="playme"
          element={
            <PlaymePage videoService={videoService} />
          }
        />

        <Route
          path="subscriptions"
          element={<SubscriptionsPage videoService={videoService} />}
        />

        <Route
          path="channels/:channelId"
          element={<ChannelPage />}
        />

        <Route
          path="library"
          element={
            <LibraryPage libraryService={libraryService} />
          }
        />

        <Route
          path="history"
          element={
            <HistoryPage libraryService={libraryService} />
          }
        />

        <Route
          path="favorites"
          element={
            <FavoritesPage libraryService={libraryService} />
          }
        />

        <Route
          path="playlists"
          element={<PlaylistsPage />}
        />

        <Route
          path="streamers"
          element={
            <StreamsPage streamService={streamService} />
          }
        />

        <Route
          path="streamers/:streamId"
          element={
            <LiveStreamPage
              liveChatClientFactory={liveChatClientFactory}
              liveChatSessionStore={liveChatSessionStore}
              streamService={streamService}
            />
          }
        />

        <Route
          path="themes"
          element={
            <ThemesPage />
          }
        />

        <Route
          path="search"
          element={
            <SearchPage discoveryService={discoveryService} />
          }
        />

        <Route
          path="categories/:slug"
          element={
            <CategoryPage discoveryService={discoveryService} />
          }
        />

        <Route
          path="upload"
          element={
            <UploadPage uploadService={uploadService} />
          }
        />

        <Route
          path="profile"
          element={<ProfilePage />}
        />

        <Route
          path="watch-party"
          element={
            <WatchPartyPage videoService={videoService} watchPartyClientFactory={watchPartyClientFactory} watchPartySessionStore={watchPartySessionStore} />
          }
        />

        <Route
          path="watch-party/:roomCode"
          element={
            <WatchPartyPage videoService={videoService} watchPartyClientFactory={watchPartyClientFactory} watchPartySessionStore={watchPartySessionStore} />
          }
        />

        <Route
          path="watch/:videoId"
          element={
            <WatchPage libraryService={libraryService} videoService={videoService} />
          }
        />
      </Route>

      <Route
        path="auth"
        element={<AuthPage />}
      />

      <Route
        path="login"
        element={<AuthPage />}
      />

      <Route
        path="register"
        element={<AuthPage />}
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App
