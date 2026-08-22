import {
  useEffect,
  type ReactNode,
} from 'react'
import {
  getThemeById,
} from './themeCatalog'
import {
  useThemeStore,
} from './useThemeStore'

interface ThemeProviderProps {
  children: ReactNode
}

function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const selectedThemeId =
    useThemeStore(
      (state) =>
        state.selectedThemeId,
    )

  useEffect(() => {
    const root =
      document.documentElement

    const theme =
      getThemeById(
        selectedThemeId,
      )

    const {
      palette,
    } = theme

    const variables:
      Record<
        string,
        string
      > = {
        '--theme-app-background':
          palette.appBackground,

        '--theme-header-background':
          palette.headerBackground,

        '--theme-sidebar-background':
          palette.sidebarBackground,

        '--theme-surface':
          palette.surface,

        '--theme-surface-hover':
          palette.surfaceHover,

        '--theme-border':
          palette.border,

        '--theme-accent':
          palette.accent,

        '--theme-accent-strong':
          palette.accentStrong,

        '--theme-accent-soft':
          palette.accentSoft,

        '--theme-text':
          palette.text,

        '--theme-muted':
          palette.muted,

        '--theme-glow':
          palette.glow,

        '--theme-banner':
          palette.banner,

        '--theme-avatar':
          palette.avatar,

        '--theme-pattern':
          palette.pattern,

        '--color-background':
          palette.appBackground,

        '--color-background-secondary':
          palette.sidebarBackground,

        '--color-surface':
          palette.surface,

        '--color-surface-hover':
          palette.surfaceHover,

        '--color-surface-active':
          palette.surfaceHover,

        '--color-border':
          palette.border,

        '--color-border-soft':
          palette.border,

        '--color-text':
          palette.text,

        '--color-text-secondary':
          palette.muted,

        '--color-text-muted':
          palette.muted,

        '--color-accent':
          palette.accent,

        '--color-accent-hover':
          palette.accentStrong,

        '--color-accent-soft':
          palette.accentSoft,
      }

    Object.entries(
      variables,
    ).forEach(
      ([
        variableName,
        value,
      ]) => {
        root.style.setProperty(
          variableName,
          value,
        )
      },
    )

    root.dataset.themeId =
      theme.id

    root.dataset.themeFamily =
      theme.family
  }, [selectedThemeId])

  return children
}

export default ThemeProvider