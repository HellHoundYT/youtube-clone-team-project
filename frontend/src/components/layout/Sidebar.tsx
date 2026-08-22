import {
  NavLink,
} from 'react-router-dom'

type IconName =
  | 'home'
  | 'play'
  | 'subscriptions'
  | 'library'
  | 'history'
  | 'favorites'
  | 'playlists'
  | 'streamers'
  | 'themes'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onNavigate: () => void
}

interface NavigationItem {
  label: string
  path: string
  icon: IconName
  end?: boolean
}

const primaryNavigation:
  NavigationItem[] = [
    {
      label: 'Home',
      path: '/',
      icon: 'home',
      end: true,
    },

    {
      label: 'Playme',
      path: '/playme',
      icon: 'play',
    },

    {
      label:
        'Subscriptions',
      path:
        '/subscriptions',
      icon:
        'subscriptions',
    },
  ]

const libraryNavigation:
  NavigationItem[] = [
    {
      label: 'Library',
      path: '/library',
      icon: 'library',
    },

    {
      label: 'History',
      path: '/history',
      icon: 'history',
    },

    {
      label: 'Favorites',
      path: '/favorites',
      icon: 'favorites',
    },

    {
      label: 'Playlists',
      path: '/playlists',
      icon: 'playlists',
    },

    {
      label: 'Streamers',
      path: '/streamers',
      icon: 'streamers',
    },

    {
      label: 'Themes',
      path: '/themes',
      icon: 'themes',
    },
  ]

function NavigationIcon({
  name,
}: {
  name: IconName
}) {
  if (
    name === 'home'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="m4 10 8-6 8 6v10h-6v-6h-4v6H4Z" />
      </svg>
    )
  }

  if (
    name === 'play'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="5"
        />

        <path d="m10 8 6 4-6 4Z" />
      </svg>
    )
  }

  if (
    name ===
    'subscriptions'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="7"
          width="16"
          height="13"
          rx="3"
        />

        <path d="m9 3 3 3 3-3" />

        <path d="m10 11 5 3-5 3Z" />
      </svg>
    )
  }

  if (
    name === 'library'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M5 4v16M10 4v16M15 7v13M19 5v15" />
      </svg>
    )
  }

  if (
    name === 'history'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8" />

        <path d="M4 4v4h4" />

        <path d="M12 8v5l3 2" />
      </svg>
    )
  }

  if (
    name ===
    'favorites'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20 8.5C20 14 12 19 12 19S4 14 4 8.5A4.5 4.5 0 0 1 12 5a4.5 4.5 0 0 1 8 3.5Z" />
      </svg>
    )
  }

  if (
    name ===
    'playlists'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M5 6h10M5 11h10M5 16h7" />

        <path d="m16 14 4 2.5-4 2.5Z" />
      </svg>
    )
  }

  if (
    name ===
    'themes'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 3a9 9 0 1 0 0 18h1.2a2.3 2.3 0 0 0 1.5-4c-.5-.4-.2-1.2.4-1.2H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3Z" />

        <circle
          cx="7.5"
          cy="10"
          r="1"
        />

        <circle
          cx="10.5"
          cy="6.8"
          r="1"
        />

        <circle
          cx="15"
          cy="7.5"
          r="1"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="9"
        r="4"
      />

      <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" />

      <path d="M18 6h2v6h-2" />
    </svg>
  )
}

function NavigationGroup({
  items,
  onNavigate,
}: {
  items:
    NavigationItem[]
  onNavigate: () => void
}) {
  return (
    <nav className="sidebar-navigation">
      {items.map(
        (item) => (
          <NavLink
            key={
              item.path
            }
            to={
              item.path
            }
            end={
              item.end
            }
            className={({
              isActive,
            }) =>
              `sidebar-link ${
                isActive
                  ? 'is-active'
                  : ''
              }`
            }
            onClick={
              onNavigate
            }
          >
            <span className="sidebar-icon">
              <NavigationIcon
                name={
                  item.icon
                }
              />
            </span>

            <span className="sidebar-label">
              {
                item.label
              }
            </span>
          </NavLink>
        ),
      )}
    </nav>
  )
}

function Sidebar({
  collapsed,
  mobileOpen,
  onNavigate,
}: SidebarProps) {
  return (
    <aside
      className={`app-sidebar ${
        collapsed
          ? 'is-collapsed'
          : ''
      } ${
        mobileOpen
          ? 'is-open'
          : ''
      }`}
    >
      <div className="sidebar-scroll">
        <NavigationGroup
          items={
            primaryNavigation
          }
          onNavigate={
            onNavigate
          }
        />

        <div className="sidebar-divider" />

        <div className="sidebar-section-title">
          Your content
        </div>

        <NavigationGroup
          items={
            libraryNavigation
          }
          onNavigate={
            onNavigate
          }
        />
      </div>

      <div className="sidebar-footer">
        <span>
          FrameSync
        </span>

        <span>
          v1
        </span>
      </div>
    </aside>
  )
}

export default Sidebar