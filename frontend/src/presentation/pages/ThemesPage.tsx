import {
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  useAppTranslation,
} from '../../shared/i18n'
import {
  defaultThemeId,
  getThemeById,
  themeAchievementContracts,
  themeCatalog,
  type ThemeConfig,
  type ThemeFamily,
} from '../../shared/theme/themeCatalog'
import {
  useThemeStore,
} from '../../shared/theme/useThemeStore'
import {
  useAuthStore,
} from '../features/auth/authStore'
import './ThemesPage.css'

const familyOrder:
  ThemeFamily[] = [
    'default',
    'city',
    'hud',
    'cyber',
    'wave',
    'space',
  ]

function getPreviewStyle(
  theme: ThemeConfig,
): CSSProperties {
  return {
    '--preview-background':
      theme.palette
        .appBackground,

    '--preview-surface':
      theme.palette.surface,

    '--preview-border':
      theme.palette.border,

    '--preview-accent':
      theme.palette.accent,

    '--preview-accent-strong':
      theme.palette
        .accentStrong,

    '--preview-accent-soft':
      theme.palette
        .accentSoft,

    '--preview-text':
      theme.palette.text,

    '--preview-muted':
      theme.palette.muted,

    '--preview-glow':
      theme.palette.glow,

    '--preview-banner':
      theme.palette.banner,

    '--preview-avatar':
      theme.palette.avatar,

    '--preview-pattern':
      theme.palette.pattern,
  } as CSSProperties
}

function BasePreview() {
  return (
    <>
      <div className="preview-base-sidebar">
        <span className="is-active" />
        <span />
        <span />
        <span />
      </div>

      <div className="preview-base-main">
        <div className="preview-base-banner">
          <div className="preview-base-avatar" />

          <div className="preview-base-lines">
            <strong />

            <span />
          </div>
        </div>

        <div className="preview-base-cards">
          <span />

          <span />

          <span />
        </div>
      </div>
    </>
  )
}

function CityPreview() {
  return (
    <>
      <div className="preview-city-glow" />

      <div className="preview-city-topbar">
        <span />

        <span />

        <span />
      </div>

      <div className="preview-city-skyline">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="preview-city-profile">
        <div className="preview-city-avatar" />

        <div className="preview-city-info">
          <strong />

          <span />
        </div>

        <div className="preview-city-button" />
      </div>

      <div className="preview-city-neon-line" />
    </>
  )
}

function HudPreview() {
  const {
    t,
  } =
    useAppTranslation()

  return (
    <>
      <div className="preview-hud-grid" />

      <span className="preview-hud-corner corner-one" />
      <span className="preview-hud-corner corner-two" />
      <span className="preview-hud-corner corner-three" />
      <span className="preview-hud-corner corner-four" />

      <div className="preview-hud-header">
        <span>
          {t(
            'themesPage.preview.userProfile',
          )}
        </span>

        <strong>
          04.22
        </strong>
      </div>

      <div className="preview-hud-profile">
        <div className="preview-hud-avatar">
          H
        </div>

        <div className="preview-hud-details">
          <strong />

          <span />
          <span />
        </div>
      </div>

      <div className="preview-hud-metrics">
        <div>
          <strong>
            84
          </strong>

          <span>
            {t(
              'themesPage.preview.level',
            )}
          </span>
        </div>

        <div>
          <strong>
            27
          </strong>

          <span>
            {t(
              'themesPage.preview.badges',
            )}
          </span>
        </div>

        <div>
          <strong>
            91%
          </strong>

          <span>
            {t(
              'themesPage.preview.sync',
            )}
          </span>
        </div>
      </div>

      <div className="preview-hud-scanline" />
    </>
  )
}

function CyberPreview() {
  const {
    t,
  } =
    useAppTranslation()

  return (
    <>
      <div className="preview-cyber-cut cut-one" />
      <div className="preview-cyber-cut cut-two" />

      <div className="preview-cyber-circuit">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="preview-cyber-profile">
        <div className="preview-cyber-avatar">
          <span />
        </div>

        <div className="preview-cyber-copy">
          <small>
            ID // 084
          </small>

          <strong />

          <span />
        </div>
      </div>

      <div className="preview-cyber-panels">
        <span />
        <span />
        <span />
      </div>

      <div className="preview-cyber-label">
        {t(
          'themesPage.preview.cyberLink',
        )}
      </div>
    </>
  )
}

function WavePreview() {
  return (
    <>
      <div className="preview-wave-orb orb-one" />
      <div className="preview-wave-orb orb-two" />

      <div className="preview-wave-line wave-one" />
      <div className="preview-wave-line wave-two" />
      <div className="preview-wave-line wave-three" />

      <div className="preview-wave-profile">
        <div className="preview-wave-avatar" />

        <div className="preview-wave-copy">
          <strong />

          <span />
        </div>

        <div className="preview-wave-pill" />
      </div>

      <div className="preview-wave-bottom">
        <span />
        <span />
      </div>
    </>
  )
}

function SpacePreview() {
  return (
    <>
      <div className="preview-space-stars">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="preview-space-nebula" />

      <div className="preview-space-planet">
        <div className="preview-space-ring" />
      </div>

      <div className="preview-space-profile">
        <div className="preview-space-avatar">
          <span />
        </div>

        <div className="preview-space-copy">
          <strong />

          <span />
        </div>
      </div>

      <div className="preview-space-orbit-dot" />
    </>
  )
}

function getFamilyPreview(
  family: ThemeFamily,
): ReactNode {
  if (
    family === 'city'
  ) {
    return <CityPreview />
  }

  if (
    family === 'hud'
  ) {
    return <HudPreview />
  }

  if (
    family === 'cyber'
  ) {
    return <CyberPreview />
  }

  if (
    family === 'wave'
  ) {
    return <WavePreview />
  }

  if (
    family === 'space'
  ) {
    return <SpacePreview />
  }

  return <BasePreview />
}

function ThemePreview({
  theme,
  selected,
}: {
  theme: ThemeConfig
  selected: boolean
}) {
  const {
    t,
  } =
    useAppTranslation()

  return (
    <div
      className={`theme-card-preview theme-preview-${theme.family}`}
      style={getPreviewStyle(
        theme,
      )}
    >
      {getFamilyPreview(
        theme.family,
      )}

      {selected && (
        <span className="theme-selected-badge">
          {t(
            'themesPage.active',
          )}
        </span>
      )}
    </div>
  )
}

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: ThemeConfig
  selected: boolean
  onSelect: () => void
}) {
  const {
    t,
  } =
    useAppTranslation()

  const themeKey =
    `themesPage.themes.${theme.id}`

  const unlockKey =
    theme.unlock.type ===
    'default'
      ? 'default'
      : theme.unlock.id ??
        'default'

  return (
    <button
      type="button"
      className={`theme-card theme-card-${theme.family} ${
        selected
          ? 'is-selected'
          : ''
      }`}
      style={getPreviewStyle(
        theme,
      )}
      aria-pressed={
        selected
      }
      onClick={
        onSelect
      }
    >
      <ThemePreview
        theme={
          theme
        }
        selected={
          selected
        }
      />

      <div className="theme-card-info">
        <div>
          <strong>
            {t(
              `${themeKey}.name`,
              {
                defaultValue:
                  theme.name,
              },
            )}
          </strong>

          <span>
            {t(
              `themesPage.families.${theme.family}`,
            )}
          </span>
        </div>

        <span
          className="theme-accent-dot"
          aria-hidden="true"
        />
      </div>

      <p>
        {t(
          `${themeKey}.description`,
          {
            defaultValue:
              theme.description,
          },
        )}
      </p>

      <div className="theme-unlock">
        <span>
          {theme.unlock
            .type ===
          'default'
            ? t(
                'themesPage.defaultUnlock',
              )
            : t(
                'themesPage.achievementUnlock',
              )}
        </span>

        <strong>
          {t(
            `themesPage.unlockTitles.${unlockKey}`,
            {
              defaultValue:
                theme.unlock
                  .title,
            },
          )}
        </strong>
      </div>
    </button>
  )
}

function ThemesPage() {
  const {
    t,
  } =
    useAppTranslation()

  const selectedThemeId =
    useThemeStore(
      (state) =>
        state.selectedThemeId,
    )

  const setTheme =
    useThemeStore(
      (state) =>
        state.setTheme,
    )

  const profile = useAuthStore((state) => state.profile)
  const updateProfile = useAuthStore((state) => state.updateProfile)

  const saveTheme = (themeId: string) => {
    setTheme(themeId)
    if (profile) {
      void updateProfile({
        ...profile,
        themeId,
      })
    }
  }

  const selectedTheme =
    getThemeById(
      selectedThemeId,
    )

  const visualFamilyCount =
    familyOrder.length - 1

  return (
    <section className="themes-page">
      <div className="themes-header">
        <div>
          <span className="themes-kicker">
            {t(
              'themesPage.kicker',
            )}
          </span>

          <h1>
            {t(
              'themesPage.title',
            )}
          </h1>

          <p>
            {t(
              'themesPage.description',
            )}
          </p>
        </div>

        <div className="themes-current">
          <span>
            {t(
              'themesPage.currentTheme',
            )}
          </span>

          <strong>
            {t(
              `themesPage.themes.${selectedTheme.id}.name`,
              {
                defaultValue:
                  selectedTheme.name,
              },
            )}
          </strong>

          <small>
            {t(
              `themesPage.families.${selectedTheme.family}`,
            )}
          </small>

          <button
            type="button"
            disabled={
              selectedThemeId ===
              defaultThemeId
            }
            onClick={
              () => saveTheme(defaultThemeId)
            }
          >
            {t(
              'themesPage.reset',
            )}
          </button>
        </div>
      </div>

      <div className="themes-summary">
        <div>
          <strong>
            {
              themeCatalog.length
            }
          </strong>

          <span>
            {t(
              'themesPage.themeVariants',
            )}
          </span>
        </div>

        <div>
          <strong>
            {
              visualFamilyCount
            }
          </strong>

          <span>
            {t(
              'themesPage.visualFamilies',
            )}
          </span>
        </div>

        <div>
          <strong>
            {t(
              'themesPage.local',
            )}
          </strong>

          <span>
            {t(
              'themesPage.persistence',
            )}
          </span>
        </div>

        <div>
          <strong>
            {t(
              'themesPage.ready',
            )}
          </strong>

          <span>
            {t(
              'themesPage.profileContract',
            )}
          </span>
        </div>
      </div>

      {familyOrder.map(
        (family) => {
          const themes =
            themeCatalog.filter(
              (theme) =>
                theme.family ===
                family,
            )

          return (
            <section
              key={
                family
              }
              className={`theme-family theme-family-${family}`}
            >
              <div className="theme-family-header">
                <div>
                  <span>
                    {t(
                      'themesPage.familyLabel',
                    )}
                  </span>

                  <h2>
                    {t(
                      `themesPage.families.${family}`,
                    )}
                  </h2>
                </div>

                <span>
                  {t(
                    'themesPage.variant',
                    {
                      count:
                        themes.length,
                    },
                  )}
                </span>
              </div>

              <div className="theme-grid">
                {themes.map(
                  (
                    theme,
                  ) => (
                    <ThemeCard
                      key={
                        theme.id
                      }
                      theme={
                        theme
                      }
                      selected={
                        selectedThemeId ===
                        theme.id
                      }
                      onSelect={() =>
                        saveTheme(
                          theme.id,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </section>
          )
        },
      )}

      <section className="theme-contracts">
        <div className="theme-family-header">
          <div>
            <span>
              {t(
                'themesPage.futureIntegration',
              )}
            </span>

            <h2>
              {t(
                'themesPage.achievementContracts',
              )}
            </h2>
          </div>

          <span>
            {t(
              'themesPage.noUserApi',
            )}
          </span>
        </div>

        <div className="theme-contract-grid">
          {themeAchievementContracts.map(
            (
              achievement,
            ) => {
              const achievementKey =
                `themesPage.achievements.${achievement.id}`

              return (
                <article
                  key={
                    achievement.id
                  }
                  className={`theme-contract-card contract-${achievement.family}`}
                >
                  <div className="theme-contract-icon">
                    ★
                  </div>

                  <div>
                    <strong>
                      {t(
                        `${achievementKey}.title`,
                        {
                          defaultValue:
                            achievement.title,
                        },
                      )}
                    </strong>

                    <p>
                      {t(
                        `${achievementKey}.description`,
                        {
                          defaultValue:
                            achievement.description,
                        },
                      )}
                    </p>

                    <span>
                      {t(
                        'themesPage.themesUnlocked',
                        {
                          count:
                            achievement
                              .unlockThemeIds
                              .length,
                        },
                      )}
                    </span>
                  </div>
                </article>
              )
            },
          )}
        </div>
      </section>
    </section>
  )
}

export default ThemesPage
