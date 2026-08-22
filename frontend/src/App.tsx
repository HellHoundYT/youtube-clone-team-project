import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import CategoryPage from './pages/CategoryPage'
import HomePage from './pages/HomePage'
import PlaceholderPage from './pages/PlaceholderPage'
import SearchPage from './pages/SearchPage'
import UploadPage from './pages/UploadPage'
import WatchPage from './pages/WatchPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={<HomePage />}
        />

        <Route
          path="playme"
          element={
            <PlaceholderPage
              title="Playme"
              description="Vertical video feed will be connected here."
            />
          }
        />

        <Route
          path="subscriptions"
          element={
            <PlaceholderPage
              title="Subscriptions"
              description="Subscription content will be connected here."
            />
          }
        />

        <Route
          path="library"
          element={
            <PlaceholderPage
              title="Library"
              description="User library content will be connected here."
            />
          }
        />

        <Route
          path="history"
          element={
            <PlaceholderPage
              title="History"
              description="Watch history will be connected here."
            />
          }
        />

        <Route
          path="favorites"
          element={
            <PlaceholderPage
              title="Favorites"
              description="Favorite videos will be connected here."
            />
          }
        />

        <Route
          path="playlists"
          element={
            <PlaceholderPage
              title="Playlists"
              description="User playlists will be connected here."
            />
          }
        />

        <Route
          path="streamers"
          element={
            <PlaceholderPage
              title="Streamers"
              description="Live streams and streamers will be connected here."
            />
          }
        />

        <Route
          path="search"
          element={<SearchPage />}
        />

        <Route
          path="categories/:slug"
          element={<CategoryPage />}
        />

        <Route
          path="upload"
          element={<UploadPage />}
        />

        <Route
          path="profile"
          element={
            <PlaceholderPage
              title="Profile"
              description="User profile will be connected here."
            />
          }
        />

        <Route
          path="watch/:videoId"
          element={<WatchPage />}
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