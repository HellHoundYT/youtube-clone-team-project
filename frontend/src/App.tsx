import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import CategoryPage from './pages/CategoryPage'
import FavoritesPage from './pages/FavoritesPage'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import LiveStreamPage from './pages/LiveStreamPage'
import PlaceholderPage from './pages/PlaceholderPage'
import PlaymePage from './pages/PlaymePage'
import SearchPage from './pages/SearchPage'
import StreamsPage from './pages/StreamsPage'
import ThemesPage from './pages/ThemesPage'
import UploadPage from './pages/UploadPage'
import WatchPage from './pages/WatchPage'
import WatchPartyPage from './pages/WatchPartyPage'
import './App.css'
import './theme/theme-runtime.css'

function App() {
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
          element={
            <PlaceholderPage
              titleKey="system.placeholders.subscriptions.title"
              descriptionKey="system.placeholders.subscriptions.description"
            />
          }
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
          element={
            <PlaceholderPage
              titleKey="system.placeholders.playlists.title"
              descriptionKey="system.placeholders.playlists.description"
            />
          }
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
          element={
            <PlaceholderPage
              titleKey="system.placeholders.profile.title"
              descriptionKey="system.placeholders.profile.description"
            />
          }
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
