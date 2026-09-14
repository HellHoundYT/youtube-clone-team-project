import {
  create,
} from 'zustand'
import {
  persist,
} from 'zustand/middleware'
import {
  defaultThemeId,
} from './themeCatalog'

type ThemeProfileSync = (
  themeId: string,
) => Promise<void>

let configuredProfileSync:
ThemeProfileSync | null = null

export function configureThemeProfileSync(
  sync: ThemeProfileSync,
) {
  configuredProfileSync = sync
}

function syncProfileTheme(
  themeId: string,
) {
  if (!configuredProfileSync) {
    return
  }

  void configuredProfileSync(
    themeId,
  ).catch(() => {
    // Local theme selection remains valid when profile persistence is unavailable.
  })
}

interface ThemeStore {
  selectedThemeId: string

  setTheme: (
    themeId: string,
  ) => void

  applyThemeFromProfile: (
    themeId: string,
  ) => void

  resetTheme: () => void
}

export const useThemeStore =
  create<ThemeStore>()(
    persist(
      (set) => ({
        selectedThemeId:
          defaultThemeId,

        setTheme: (
          themeId,
        ) => {
          set({
            selectedThemeId:
              themeId,
          })

          syncProfileTheme(
            themeId,
          )
        },

        applyThemeFromProfile: (
          themeId,
        ) => {
          set({
            selectedThemeId:
              themeId,
          })
        },

        resetTheme: () => {
          set({
            selectedThemeId:
              defaultThemeId,
          })

          syncProfileTheme(
            defaultThemeId,
          )
        },
      }),

      {
        name:
          'framesync-theme-v1',
        version: 1,
      },
    ),
  )
