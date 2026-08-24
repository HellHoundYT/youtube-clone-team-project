import {
  create,
} from 'zustand'
import {
  persist,
} from 'zustand/middleware'
import {
  defaultThemeId,
} from './themeCatalog'

interface ThemeStore {
  selectedThemeId: string

  setTheme: (
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
        },

        resetTheme: () => {
          set({
            selectedThemeId:
              defaultThemeId,
          })
        },
      }),

      {
        name:
          'framesync-theme-v1',
        version: 1,
      },
    ),
  )