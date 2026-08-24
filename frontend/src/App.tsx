import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import {
  useEffect,
} from 'react'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'
import ChannelPage from './pages/ChannelPage'
import CategoryPage from './pages/CategoryPage'
import FavoritesPage from './pages/FavoritesPage'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import LiveStreamPage from './pages/LiveStreamPage'
import PlaymePage from './pages/PlaymePage'
import PlaylistsPage from './pages/PlaylistsPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import StreamsPage from './pages/StreamsPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import ThemesPage from './pages/ThemesPage'
import UploadPage from './pages/UploadPage'
import WatchPage from './pages/WatchPage'
import WatchPartyPage from './pages/WatchPartyPage'
import './App.css'
import './theme/theme-runtime.css'
import {
  useAuthStore,
} from './features/auth/authStore'

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
            <HomePage />
          }
        />

        <Route
          path="playme"
          element={
            <PlaymePage />
          }
        />

        <Route
          path="subscriptions"
          element={<SubscriptionsPage />}
        />

        <Route
          path="channels/:channelId"
          element={<ChannelPage />}
        />

        <Route
          path="library"
          element={
            <LibraryPage />
          }
        />

        <Route
          path="history"
          element={
            <HistoryPage />
          }
        />

        <Route
          path="favorites"
          element={
            <FavoritesPage />
          }
        />

        <Route
          path="playlists"
          element={<PlaylistsPage />}
        />

        <Route
          path="streamers"
          element={
            <StreamsPage />
          }
        />

        <Route
          path="streamers/:streamId"
          element={
            <LiveStreamPage />
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
            <SearchPage />
          }
        />

        <Route
          path="categories/:slug"
          element={
            <CategoryPage />
          }
        />

        <Route
          path="upload"
          element={
            <UploadPage />
          }
        />

        <Route
          path="profile"
          element={<ProfilePage />}
        />
        <Route
          path="watch-party"
          element={
            <WatchPartyPage />
          }
        />

        <Route
          path="watch-party/:roomCode"
          element={
            <WatchPartyPage />
          }
        />

        <Route
          path="watch/:videoId"
          element={
            <WatchPage />
          }
        />
      </Route>

      <Route
        path="auth"
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
