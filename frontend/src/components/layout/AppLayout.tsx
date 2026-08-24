import {
  useState,
} from 'react'
import {
  Outlet,
} from 'react-router-dom'
import {
  useAppTranslation,
} from '../../shared/i18n'
import Header from './Header'
import Sidebar from './Sidebar'

function AppLayout() {
  const {
    t,
  } =
    useAppTranslation()

  const [
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  ] =
    useState(false)

  const [
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  ] =
    useState(false)

  const handleMenuClick =
    () => {
      setIsSidebarCollapsed(
        (current) =>
          !current,
      )

      setIsMobileSidebarOpen(
        (current) =>
          !current,
      )
    }

  const handleMobileNavigation =
    () => {
      setIsMobileSidebarOpen(
        false,
      )
    }

  return (
    <div
      className={`app-shell ${
        isSidebarCollapsed
          ? 'sidebar-collapsed'
          : ''
      }`}
    >
      <Header
        onMenuClick={
          handleMenuClick
        }
      />

      <Sidebar
        collapsed={
          isSidebarCollapsed
        }
        mobileOpen={
          isMobileSidebarOpen
        }
        onNavigate={
          handleMobileNavigation
        }
      />

      <button
        type="button"
        className={`sidebar-backdrop ${
          isMobileSidebarOpen
            ? 'is-visible'
            : ''
        }`}
        aria-label={t(
          'system.closeNavigation',
        )}
        onClick={() =>
          setIsMobileSidebarOpen(
            false,
          )
        }
      />

      <main className="app-content">
        <div className="content-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
