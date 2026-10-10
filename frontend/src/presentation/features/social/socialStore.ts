import {
  create,
} from 'zustand'
import type {
  SocialService,
} from '../../../application/social/service'

interface SocialState {
  unreadCount: number

  refreshUnreadCount:
    () => Promise<void>

  setUnreadCount:
    (count: number) => void

  clear:
    () => void
}

let configuredSocialService:
SocialService | null = null

export function configureSocialStore(
  socialService: SocialService,
) {
  configuredSocialService =
    socialService
}

function getSocialService() {
  if (!configuredSocialService) {
    throw new Error(
      'Social store is not configured.',
    )
  }

  return configuredSocialService
}

export const useSocialStore =
  create<SocialState>(
    (set) => ({
      unreadCount: 0,

      refreshUnreadCount:
        async () => {
          try {
            const count =
              await getSocialService()
                .getUnreadCount()

            set({
              unreadCount:
                count,
            })
          } catch {
            // Header polling should stay quiet
            // during transient auth/network failures.
          }
        },

      setUnreadCount:
        (count) => {
          set({
            unreadCount:
              Math.max(
                0,
                count,
              ),
          })
        },

      clear:
        () => {
          set({
            unreadCount:
              0,
          })
        },
    }),
  )
