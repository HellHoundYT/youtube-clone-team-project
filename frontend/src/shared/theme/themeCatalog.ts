export type ThemeFamily =
  | 'default'
  | 'city'
  | 'hud'
  | 'cyber'
  | 'wave'
  | 'space'

export type ThemeAccent =
  | 'violet'
  | 'blue'
  | 'red'
  | 'pink'

export interface ThemePalette {
  appBackground: string
  headerBackground: string
  sidebarBackground: string
  surface: string
  surfaceHover: string
  border: string

  accent: string
  accentStrong: string
  accentSoft: string

  text: string
  muted: string

  glow: string

  banner: string
  avatar: string
  pattern: string
}

export interface ThemeUnlockRequirement {
  type:
    | 'default'
    | 'achievement'

  id: string | null

  title: string
  description: string
}

export interface ThemeConfig {
  id: string
  name: string

  family: ThemeFamily
  accent: ThemeAccent

  description: string

  palette: ThemePalette

  unlock: ThemeUnlockRequirement
}

export interface ThemeAchievementContract {
  id: string

  title: string
  description: string

  family: ThemeFamily

  unlockThemeIds: string[]
}

const defaultUnlock: ThemeUnlockRequirement = {
  type: 'default',
  id: null,
  title: 'Available',
  description:
    'Base theme available by default.',
}

function achievementUnlock(
  id: string,
  title: string,
): ThemeUnlockRequirement {
  return {
    type: 'achievement',
    id,
    title,
    description:
      'Future achievement integration. Available in dev preview.',
  }
}

export const defaultThemeId =
  'amtlis-default'

export const themeCatalog: ThemeConfig[] =
  [
    {
      id: 'amtlis-default',
      name: 'AMTLIS Default',
      family: 'default',
      accent: 'violet',
      description:
        'Original dark AMTLIS look with violet accents.',
      palette: {
        appBackground: '#08090d',
        headerBackground:
          'rgba(8, 9, 13, 0.96)',
        sidebarBackground:
          '#090a0e',
        surface: '#101117',
        surfaceHover: '#181920',
        border: '#252630',

        accent: '#7557ef',
        accentStrong: '#8665ff',
        accentSoft:
          'rgba(117, 87, 239, 0.24)',

        text: '#f5f4fa',
        muted: '#858a98',

        glow:
          'rgba(116, 82, 255, 0.18)',

        banner:
          'linear-gradient(135deg, #171122 0%, #2b1953 48%, #141018 100%)',

        avatar:
          'linear-gradient(135deg, #8662ff, #6946e8)',

        pattern:
          'linear-gradient(rgba(117, 87, 239, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(117, 87, 239, 0.035) 1px, transparent 1px)',
      },
      unlock:
        defaultUnlock,
    },

    {
      id: 'city-blue',
      name: 'City Blue',
      family: 'city',
      accent: 'blue',
      description:
        'Cold metropolitan theme with electric blue lighting.',
      palette: {
        appBackground: '#070b11',
        headerBackground:
          'rgba(6, 12, 19, 0.96)',
        sidebarBackground:
          '#080d14',
        surface: '#0d1620',
        surfaceHover: '#142333',
        border: '#203447',

        accent: '#42a5ff',
        accentStrong: '#6cb9ff',
        accentSoft:
          'rgba(66, 165, 255, 0.22)',

        text: '#f1f8ff',
        muted: '#8295a8',

        glow:
          'rgba(66, 165, 255, 0.22)',

        banner:
          'linear-gradient(120deg, #07131f 0%, #0e3655 52%, #071019 100%)',

        avatar:
          'linear-gradient(135deg, #61c4ff, #2277e6)',

        pattern:
          'linear-gradient(rgba(66, 165, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(66, 165, 255, 0.04) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-city-pack',
          'City Explorer',
        ),
    },

    {
      id: 'city-red',
      name: 'City Red',
      family: 'city',
      accent: 'red',
      description:
        'Night city atmosphere with deep red neon.',
      palette: {
        appBackground: '#0c080a',
        headerBackground:
          'rgba(15, 8, 10, 0.96)',
        sidebarBackground:
          '#10090b',
        surface: '#190e12',
        surfaceHover: '#251319',
        border: '#412029',

        accent: '#ff5368',
        accentStrong: '#ff7182',
        accentSoft:
          'rgba(255, 83, 104, 0.22)',

        text: '#fff3f5',
        muted: '#aa858c',

        glow:
          'rgba(255, 75, 100, 0.18)',

        banner:
          'linear-gradient(120deg, #17090c 0%, #55131e 50%, #16090d 100%)',

        avatar:
          'linear-gradient(135deg, #ff6679, #c9203a)',

        pattern:
          'linear-gradient(rgba(255, 83, 104, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 83, 104, 0.035) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-city-pack',
          'City Explorer',
        ),
    },

    {
      id: 'city-pink',
      name: 'City Pink',
      family: 'city',
      accent: 'pink',
      description:
        'Soft cyber city palette with vivid pink highlights.',
      palette: {
        appBackground: '#0d0810',
        headerBackground:
          'rgba(14, 8, 16, 0.96)',
        sidebarBackground:
          '#100912',
        surface: '#1a0f1e',
        surfaceHover: '#26142c',
        border: '#43234b',

        accent: '#ec5dff',
        accentStrong: '#f27cff',
        accentSoft:
          'rgba(236, 93, 255, 0.22)',

        text: '#fff3ff',
        muted: '#aa86ad',

        glow:
          'rgba(236, 93, 255, 0.19)',

        banner:
          'linear-gradient(120deg, #17091a 0%, #52175c 50%, #160917 100%)',

        avatar:
          'linear-gradient(135deg, #ff7df1, #b93ad4)',

        pattern:
          'linear-gradient(rgba(236, 93, 255, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(236, 93, 255, 0.035) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-city-pack',
          'City Explorer',
        ),
    },

    {
      id: 'hud-blue',
      name: 'HUD Blue',
      family: 'hud',
      accent: 'blue',
      description:
        'Tactical game interface inspired by futuristic HUD panels.',
      palette: {
        appBackground: '#050b0f',
        headerBackground:
          'rgba(5, 12, 17, 0.97)',
        sidebarBackground:
          '#071016',
        surface: '#0a1820',
        surfaceHover: '#102832',
        border: '#1c4554',

        accent: '#36d5ff',
        accentStrong: '#6ee2ff',
        accentSoft:
          'rgba(54, 213, 255, 0.18)',

        text: '#edfbff',
        muted: '#75a5b2',

        glow:
          'rgba(54, 213, 255, 0.17)',

        banner:
          'linear-gradient(135deg, #05141a 0%, #083845 48%, #061116 100%)',

        avatar:
          'linear-gradient(135deg, #64e6ff, #168eac)',

        pattern:
          'linear-gradient(rgba(54, 213, 255, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(54, 213, 255, 0.055) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-hud-pack',
          'Interface Operator',
        ),
    },

    {
      id: 'hud-red',
      name: 'HUD Red',
      family: 'hud',
      accent: 'red',
      description:
        'Tactical HUD with warning-red interface lighting.',
      palette: {
        appBackground: '#0b0607',
        headerBackground:
          'rgba(14, 6, 8, 0.97)',
        sidebarBackground:
          '#100708',
        surface: '#1b0c0f',
        surfaceHover: '#281116',
        border: '#52212b',

        accent: '#ff405e',
        accentStrong: '#ff6b80',
        accentSoft:
          'rgba(255, 64, 94, 0.19)',

        text: '#fff0f2',
        muted: '#b17d85',

        glow:
          'rgba(255, 64, 94, 0.17)',

        banner:
          'linear-gradient(135deg, #16070a 0%, #4f111d 48%, #120609 100%)',

        avatar:
          'linear-gradient(135deg, #ff6c7f, #b91731)',

        pattern:
          'linear-gradient(rgba(255, 64, 94, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 64, 94, 0.05) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-hud-pack',
          'Interface Operator',
        ),
    },

    {
      id: 'hud-pink',
      name: 'HUD Pink',
      family: 'hud',
      accent: 'pink',
      description:
        'HUD layout with bright magenta interface accents.',
      palette: {
        appBackground: '#0c070e',
        headerBackground:
          'rgba(14, 7, 17, 0.97)',
        sidebarBackground:
          '#100812',
        surface: '#1a0d1e',
        surfaceHover: '#28132e',
        border: '#4d2457',

        accent: '#f151ff',
        accentStrong: '#f778ff',
        accentSoft:
          'rgba(241, 81, 255, 0.19)',

        text: '#fff2ff',
        muted: '#af82b4',

        glow:
          'rgba(241, 81, 255, 0.17)',

        banner:
          'linear-gradient(135deg, #160819 0%, #4c1353 48%, #120714 100%)',

        avatar:
          'linear-gradient(135deg, #ff75f3, #b525ca)',

        pattern:
          'linear-gradient(rgba(241, 81, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(241, 81, 255, 0.05) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-hud-pack',
          'Interface Operator',
        ),
    },

    {
      id: 'cyber-blue',
      name: 'Cyber Blue',
      family: 'cyber',
      accent: 'blue',
      description:
        'Sharper cyber-tech surfaces with saturated blue energy.',
      palette: {
        appBackground: '#06080f',
        headerBackground:
          'rgba(6, 8, 16, 0.97)',
        sidebarBackground:
          '#080b14',
        surface: '#0e1320',
        surfaceHover: '#161d2c',
        border: '#263654',

        accent: '#547cff',
        accentStrong: '#7897ff',
        accentSoft:
          'rgba(84, 124, 255, 0.21)',

        text: '#f1f4ff',
        muted: '#838da9',

        glow:
          'rgba(84, 124, 255, 0.19)',

        banner:
          'linear-gradient(130deg, #0a0d18 0%, #152a64 50%, #090b15 100%)',

        avatar:
          'linear-gradient(135deg, #789aff, #3550d4)',

        pattern:
          'repeating-linear-gradient(120deg, rgba(84, 124, 255, 0.04) 0, rgba(84, 124, 255, 0.04) 1px, transparent 1px, transparent 18px)',
      },
      unlock:
        achievementUnlock(
          'theme-cyber-pack',
          'Cyber Specialist',
        ),
    },

    {
      id: 'cyber-red',
      name: 'Cyber Red',
      family: 'cyber',
      accent: 'red',
      description:
        'Aggressive cyber-tech theme with red energy lines.',
      palette: {
        appBackground: '#0c0709',
        headerBackground:
          'rgba(13, 7, 9, 0.97)',
        sidebarBackground:
          '#11090c',
        surface: '#1c0f14',
        surfaceHover: '#29151c',
        border: '#49212d',

        accent: '#ff496b',
        accentStrong: '#ff6d88',
        accentSoft:
          'rgba(255, 73, 107, 0.21)',

        text: '#fff1f4',
        muted: '#a9818a',

        glow:
          'rgba(255, 73, 107, 0.18)',

        banner:
          'linear-gradient(130deg, #15090d 0%, #581425 50%, #11080b 100%)',

        avatar:
          'linear-gradient(135deg, #ff6b89, #bd2544)',

        pattern:
          'repeating-linear-gradient(120deg, rgba(255, 73, 107, 0.04) 0, rgba(255, 73, 107, 0.04) 1px, transparent 1px, transparent 18px)',
      },
      unlock:
        achievementUnlock(
          'theme-cyber-pack',
          'Cyber Specialist',
        ),
    },

    {
      id: 'cyber-pink',
      name: 'Cyber Pink',
      family: 'cyber',
      accent: 'pink',
      description:
        'Cyber-tech surfaces with high-energy pink highlights.',
      palette: {
        appBackground: '#0b0710',
        headerBackground:
          'rgba(13, 7, 16, 0.97)',
        sidebarBackground:
          '#100912',
        surface: '#1b1020',
        surfaceHover: '#29162f',
        border: '#492753',

        accent: '#e95cff',
        accentStrong: '#f07cff',
        accentSoft:
          'rgba(233, 92, 255, 0.21)',

        text: '#fff2ff',
        muted: '#aa83ae',

        glow:
          'rgba(233, 92, 255, 0.18)',

        banner:
          'linear-gradient(130deg, #140917 0%, #50165d 50%, #110813 100%)',

        avatar:
          'linear-gradient(135deg, #f47cff, #a837ce)',

        pattern:
          'repeating-linear-gradient(120deg, rgba(233, 92, 255, 0.04) 0, rgba(233, 92, 255, 0.04) 1px, transparent 1px, transparent 18px)',
      },
      unlock:
        achievementUnlock(
          'theme-cyber-pack',
          'Cyber Specialist',
        ),
    },

    {
      id: 'wave-blue',
      name: 'Wave Blue',
      family: 'wave',
      accent: 'blue',
      description:
        'Smooth neon-wave atmosphere with cool blue lighting.',
      palette: {
        appBackground: '#070a12',
        headerBackground:
          'rgba(7, 10, 18, 0.96)',
        sidebarBackground:
          '#090d16',
        surface: '#101725',
        surfaceHover: '#172238',
        border: '#283a5d',

        accent: '#568cff',
        accentStrong: '#79a5ff',
        accentSoft:
          'rgba(86, 140, 255, 0.21)',

        text: '#f3f6ff',
        muted: '#8792ac',

        glow:
          'rgba(86, 140, 255, 0.2)',

        banner:
          'radial-gradient(circle at 75% 45%, rgba(83, 130, 255, 0.45), transparent 34%), linear-gradient(135deg, #0a1020, #182652 52%, #0a0d17)',

        avatar:
          'linear-gradient(135deg, #78b2ff, #4850dd)',

        pattern:
          'radial-gradient(circle at 75% 20%, rgba(86, 140, 255, 0.06), transparent 26rem)',
      },
      unlock:
        achievementUnlock(
          'theme-wave-pack',
          'Wave Rider',
        ),
    },

    {
      id: 'wave-red',
      name: 'Wave Red',
      family: 'wave',
      accent: 'red',
      description:
        'Dark flowing surfaces illuminated by red neon.',
      palette: {
        appBackground: '#0d080b',
        headerBackground:
          'rgba(14, 8, 11, 0.96)',
        sidebarBackground:
          '#110a0d',
        surface: '#1c1015',
        surfaceHover: '#29171f',
        border: '#472633',

        accent: '#ff5274',
        accentStrong: '#ff748f',
        accentSoft:
          'rgba(255, 82, 116, 0.21)',

        text: '#fff3f6',
        muted: '#aa858f',

        glow:
          'rgba(255, 82, 116, 0.19)',

        banner:
          'radial-gradient(circle at 75% 45%, rgba(255, 73, 111, 0.42), transparent 34%), linear-gradient(135deg, #170b10, #531729 52%, #12090d)',

        avatar:
          'linear-gradient(135deg, #ff7893, #c72b51)',

        pattern:
          'radial-gradient(circle at 75% 20%, rgba(255, 82, 116, 0.06), transparent 26rem)',
      },
      unlock:
        achievementUnlock(
          'theme-wave-pack',
          'Wave Rider',
        ),
    },

    {
      id: 'wave-pink',
      name: 'Wave Pink',
      family: 'wave',
      accent: 'pink',
      description:
        'Smooth neon-wave atmosphere with vivid pink energy.',
      palette: {
        appBackground: '#0c0711',
        headerBackground:
          'rgba(13, 7, 17, 0.96)',
        sidebarBackground:
          '#100914',
        surface: '#1a1022',
        surfaceHover: '#271731',
        border: '#472852',

        accent: '#ed63ff',
        accentStrong: '#f383ff',
        accentSoft:
          'rgba(237, 99, 255, 0.21)',

        text: '#fff4ff',
        muted: '#aa87af',

        glow:
          'rgba(237, 99, 255, 0.2)',

        banner:
          'radial-gradient(circle at 75% 45%, rgba(230, 82, 255, 0.44), transparent 34%), linear-gradient(135deg, #140a19, #501c5d 52%, #100914)',

        avatar:
          'linear-gradient(135deg, #f58cff, #b343d4)',

        pattern:
          'radial-gradient(circle at 75% 20%, rgba(237, 99, 255, 0.06), transparent 26rem)',
      },
      unlock:
        achievementUnlock(
          'theme-wave-pack',
          'Wave Rider',
        ),
    },

    {
      id: 'space-blue',
      name: 'Space Blue',
      family: 'space',
      accent: 'blue',
      description:
        'Deep-space theme with blue stellar lighting.',
      palette: {
        appBackground: '#05070e',
        headerBackground:
          'rgba(5, 7, 15, 0.96)',
        sidebarBackground:
          '#070a13',
        surface: '#0d1220',
        surfaceHover: '#151d30',
        border: '#26314c',

        accent: '#6388ff',
        accentStrong: '#83a0ff',
        accentSoft:
          'rgba(99, 136, 255, 0.21)',

        text: '#f4f6ff',
        muted: '#8790aa',

        glow:
          'rgba(99, 136, 255, 0.2)',

        banner:
          'radial-gradient(circle at 25% 30%, rgba(76, 112, 255, 0.5), transparent 24%), radial-gradient(circle at 78% 38%, rgba(82, 56, 175, 0.42), transparent 28%), linear-gradient(135deg, #070913, #151934)',

        avatar:
          'linear-gradient(135deg, #85a3ff, #514bd8)',

        pattern:
          'radial-gradient(circle at 20% 25%, rgba(255, 255, 255, 0.09) 1px, transparent 1px), radial-gradient(circle at 75% 65%, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-space-pack',
          'Star Traveller',
        ),
    },

    {
      id: 'space-red',
      name: 'Space Red',
      family: 'space',
      accent: 'red',
      description:
        'Dark cosmic environment with crimson nebula lighting.',
      palette: {
        appBackground: '#0b070a',
        headerBackground:
          'rgba(13, 7, 10, 0.96)',
        sidebarBackground:
          '#10090c',
        surface: '#190f14',
        surfaceHover: '#25161d',
        border: '#412631',

        accent: '#ff5875',
        accentStrong: '#ff7890',
        accentSoft:
          'rgba(255, 88, 117, 0.21)',

        text: '#fff4f6',
        muted: '#a9878e',

        glow:
          'rgba(255, 88, 117, 0.19)',

        banner:
          'radial-gradient(circle at 25% 30%, rgba(217, 49, 81, 0.5), transparent 24%), radial-gradient(circle at 78% 38%, rgba(124, 35, 67, 0.42), transparent 28%), linear-gradient(135deg, #13080c, #30131d)',

        avatar:
          'linear-gradient(135deg, #ff8298, #b9274a)',

        pattern:
          'radial-gradient(circle at 20% 25%, rgba(255, 255, 255, 0.08) 1px, transparent 1px), radial-gradient(circle at 75% 65%, rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-space-pack',
          'Star Traveller',
        ),
    },

    {
      id: 'space-pink',
      name: 'Space Pink',
      family: 'space',
      accent: 'pink',
      description:
        'Cosmic theme with pink and violet nebula energy.',
      palette: {
        appBackground: '#0a0710',
        headerBackground:
          'rgba(12, 7, 15, 0.96)',
        sidebarBackground:
          '#0f0913',
        surface: '#190f20',
        surfaceHover: '#25162e',
        border: '#40274b',

        accent: '#e765ff',
        accentStrong: '#ef84ff',
        accentSoft:
          'rgba(231, 101, 255, 0.21)',

        text: '#fff4ff',
        muted: '#a789ad',

        glow:
          'rgba(231, 101, 255, 0.19)',

        banner:
          'radial-gradient(circle at 25% 30%, rgba(203, 78, 255, 0.5), transparent 24%), radial-gradient(circle at 78% 38%, rgba(111, 47, 168, 0.45), transparent 28%), linear-gradient(135deg, #120817, #2b1435)',

        avatar:
          'linear-gradient(135deg, #f48cff, #9c42d3)',

        pattern:
          'radial-gradient(circle at 20% 25%, rgba(255, 255, 255, 0.08) 1px, transparent 1px), radial-gradient(circle at 75% 65%, rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
      },
      unlock:
        achievementUnlock(
          'theme-space-pack',
          'Star Traveller',
        ),
    },
  ]

export const themeAchievementContracts: ThemeAchievementContract[] =
  [
    {
      id: 'theme-city-pack',
      title: 'City Explorer',
      description:
        'Future achievement contract for unlocking City themes.',
      family: 'city',
      unlockThemeIds: [
        'city-blue',
        'city-red',
        'city-pink',
      ],
    },

    {
      id: 'theme-hud-pack',
      title: 'Interface Operator',
      description:
        'Future achievement contract for unlocking HUD themes.',
      family: 'hud',
      unlockThemeIds: [
        'hud-blue',
        'hud-red',
        'hud-pink',
      ],
    },

    {
      id: 'theme-cyber-pack',
      title: 'Cyber Specialist',
      description:
        'Future achievement contract for unlocking Cyber themes.',
      family: 'cyber',
      unlockThemeIds: [
        'cyber-blue',
        'cyber-red',
        'cyber-pink',
      ],
    },

    {
      id: 'theme-wave-pack',
      title: 'Wave Rider',
      description:
        'Future achievement contract for unlocking Wave themes.',
      family: 'wave',
      unlockThemeIds: [
        'wave-blue',
        'wave-red',
        'wave-pink',
      ],
    },

    {
      id: 'theme-space-pack',
      title: 'Star Traveller',
      description:
        'Future achievement contract for unlocking Space themes.',
      family: 'space',
      unlockThemeIds: [
        'space-blue',
        'space-red',
        'space-pink',
      ],
    },
  ]

export function getThemeById(
  themeId: string,
): ThemeConfig {
  return (
    themeCatalog.find(
      (theme) =>
        theme.id ===
        themeId,
    ) ??
    themeCatalog[0]
  )
}