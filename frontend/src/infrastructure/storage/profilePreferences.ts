interface ProfilePreferences {
  avatarDataUrl: string | null
  themeId: string | null
}

function getStorageKey(
  userId: string,
) {
  return `amtlis.profile-preferences.${userId}`
}

export function loadProfilePreferences(
  userId: string,
): ProfilePreferences {
  if (typeof window === 'undefined') {
    return {
      avatarDataUrl: null,
      themeId: null,
    }
  }

  try {
    const stored =
      window.localStorage.getItem(
        getStorageKey(userId),
      )

    if (!stored) {
      return {
        avatarDataUrl: null,
        themeId: null,
      }
    }

    const preferences =
      JSON.parse(stored) as Partial<ProfilePreferences>

    return {
      avatarDataUrl:
        typeof preferences.avatarDataUrl === 'string'
          ? preferences.avatarDataUrl
          : null,
      themeId:
        typeof preferences.themeId === 'string'
          ? preferences.themeId
          : null,
    }
  } catch {
    return {
      avatarDataUrl: null,
      themeId: null,
    }
  }
}

export function saveProfilePreferences(
  userId: string,
  preferences: ProfilePreferences,
) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(preferences),
  )
}
