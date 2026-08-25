import {
  type FormEvent,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import {
  useAppTranslation,
} from '../../../shared/i18n'
import {
  useAuthStore,
} from '../../features/auth/authStore'
import LanguageSwitcher from './LanguageSwitcher'

interface HeaderProps {
  onMenuClick: () => void
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
      />

      <path d="m16 16 4 4" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 16V5" />

      <path d="m8 9 4-4 4 4" />

      <path d="M5 14v5h14v-5" />
    </svg>
  )
}

function Header({
  onMenuClick,
}: HeaderProps) {
  const navigate =
    useNavigate()

  const {
    t,
  } =
    useAppTranslation()

  const [
    searchValue,
    setSearchValue,
  ] = useState('')
  const profile =
    useAuthStore((state) => state.profile)

  const profileInitials =
    profile?.displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ??
    'IN'

  const handleSearch = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const query =
      searchValue.trim()

    if (!query) {
      return
    }

    navigate(
      `/search?query=${encodeURIComponent(
        query,
      )}`,
    )
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="icon-button menu-button"
          aria-label={t(
            'layout.toggleNavigation',
          )}
          onClick={
            onMenuClick
          }
        >
          <MenuIcon />
        </button>

        <Link
          className="brand"
          to="/"
          aria-label={t(
            'layout.homeAria',
          )}
        >
          <span className="brand-mark">
            <span className="brand-play" />
          </span>

          <span className="brand-name">
            AMTLIS
          </span>
        </Link>
      </div>

      <form
        className="header-search"
        onSubmit={
          handleSearch
        }
      >
        <div className="search-field">
          <SearchIcon />

          <input
            type="search"
            value={
              searchValue
            }
            placeholder={t(
              'layout.searchPlaceholder',
            )}
            aria-label={t(
              'layout.searchAria',
            )}
            onChange={(
              event,
            ) =>
              setSearchValue(
                event.target
                  .value,
              )
            }
          />
        </div>

        <button
          className="search-button"
          type="submit"
        >
          {t(
            'common.search',
          )}
        </button>
      </form>

      <div className="header-actions">
        <LanguageSwitcher />

        <button
          type="button"
          className="header-create-button"
          onClick={() =>
            navigate(
              '/upload',
            )
          }
        >
          <UploadIcon />

          <span>
            {t(
              'common.upload',
            )}
          </span>
        </button>

        <button
          type="button"
          className="profile-button"
          aria-label={t(
            'layout.openProfile',
          )}
          onClick={() =>
            navigate(
              profile ? '/profile' : '/auth',
            )
          }
        >
          {profileInitials}
        </button>
      </div>
    </header>
  )
}

export default Header
