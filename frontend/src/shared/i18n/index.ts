import i18n from 'i18next'
import {
  initReactI18next,
  useTranslation,
} from 'react-i18next'
import discoveryEn from './locales/discovery.en'
import discoveryUk from './locales/discovery.uk'
import en from './locales/en'
import liveEn from './locales/live.en'
import liveUk from './locales/live.uk'
import playmeEn from './locales/playme.en'
import playmeUk from './locales/playme.uk'
import systemEn from './locales/system.en'
import systemUk from './locales/system.uk'
import themesEn from './locales/themes.en'
import themesUk from './locales/themes.uk'
import watchPartyEn from './locales/watchParty.en'
import watchPartyUk from './locales/watchParty.uk'
import uk from './locales/uk'

export type AppLanguage =
  | 'en'
  | 'uk'

export const languageStorageKey =
  'amtlis.language'

export const supportedLanguages: {
  code: AppLanguage
  shortLabel: string
}[] = [
  {
    code: 'en',
    shortLabel: 'EN',
  },
  {
    code: 'uk',
    shortLabel: 'UA',
  },
]

function normalizeLanguage(
  value:
    | string
    | null
    | undefined,
): AppLanguage {
  if (
    value
      ?.toLowerCase()
      .startsWith('uk')
  ) {
    return 'uk'
  }

  return 'en'
}

function getInitialLanguage():
AppLanguage {
  if (
    typeof window ===
    'undefined'
  ) {
    return 'en'
  }

  const savedLanguage =
    window.localStorage.getItem(
      languageStorageKey,
    )

  if (savedLanguage) {
    return normalizeLanguage(
      savedLanguage,
    )
  }

  return normalizeLanguage(
    window.navigator.language,
  )
}

const initialLanguage =
  getInitialLanguage()

if (!i18n.isInitialized) {
  void i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: {
            ...en,
            ...discoveryEn,
            ...liveEn,
            ...playmeEn,
            ...systemEn,
            ...themesEn,
            ...watchPartyEn,
          },
        },

        uk: {
          translation: {
            ...uk,
            ...discoveryUk,
            ...liveUk,
            ...playmeUk,
            ...systemUk,
            ...themesUk,
            ...watchPartyUk,
          },
        },
      },

      lng:
        initialLanguage,

      fallbackLng:
        'en',

      supportedLngs: [
        'en',
        'uk',
      ],

      interpolation: {
        escapeValue:
          false,
      },
    })
}

function syncDocumentLanguage(
  language: string,
) {
  if (
    typeof document ===
    'undefined'
  ) {
    return
  }

  document.documentElement.lang =
    normalizeLanguage(
      language,
    )
}

function persistLanguage(
  language: string,
) {
  if (
    typeof window ===
    'undefined'
  ) {
    return
  }

  window.localStorage.setItem(
    languageStorageKey,
    normalizeLanguage(
      language,
    ),
  )
}

syncDocumentLanguage(
  initialLanguage,
)

i18n.on(
  'languageChanged',
  (language) => {
    syncDocumentLanguage(
      language,
    )

    persistLanguage(
      language,
    )
  },
)

export function useAppTranslation() {
  return useTranslation()
}

export async function changeAppLanguage(
  language: AppLanguage,
) {
  await i18n.changeLanguage(
    language,
  )
}

export function getCurrentLanguage():
AppLanguage {
  return normalizeLanguage(
    i18n.resolvedLanguage ??
      i18n.language,
  )
}

export default i18n
