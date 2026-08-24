import i18n from 'i18next'
import {
  initReactI18next,
  useTranslation,
} from 'react-i18next'
import type {
  KeyValueStore,
} from '../storage/keyValueStore'
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

let configuredStorage:
KeyValueStore | null = null

let listenerRegistered =
  false

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

function getInitialLanguage(
  storage:
    KeyValueStore,
): AppLanguage {
  const savedLanguage =
    storage.getItem(
      languageStorageKey,
    )

  if (savedLanguage) {
    return normalizeLanguage(
      savedLanguage,
    )
  }

  if (
    typeof navigator ===
    'undefined'
  ) {
    return 'en'
  }

  return normalizeLanguage(
    navigator.language,
  )
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
  configuredStorage
    ?.setItem(
      languageStorageKey,
      normalizeLanguage(
        language,
      ),
    )
}

function handleLanguageChanged(
  language: string,
) {
  syncDocumentLanguage(
    language,
  )

  persistLanguage(
    language,
  )
}

export async function initializeAppI18n(
  storage:
    KeyValueStore,
) {
  configuredStorage =
    storage

  const initialLanguage =
    getInitialLanguage(
      storage,
    )

  if (!i18n.isInitialized) {
    await i18n
      .use(
        initReactI18next,
      )
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
  } else {
    await i18n.changeLanguage(
      initialLanguage,
    )
  }

  syncDocumentLanguage(
    i18n.resolvedLanguage ??
      initialLanguage,
  )

  if (!listenerRegistered) {
    i18n.on(
      'languageChanged',
      handleLanguageChanged,
    )

    listenerRegistered =
      true
  }
}

export function useAppTranslation() {
  return useTranslation()
}

export async function changeAppLanguage(
  language:
    AppLanguage,
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
