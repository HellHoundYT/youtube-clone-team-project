const en = {
  common: {
    language: 'Language',
    english: 'English',
    ukrainian: 'Ukrainian',
    search: 'Search',
    upload: 'Upload',
    retry: 'Try again',

    category: {
      all: 'All',
      music: 'Music',
      games: 'Games',
      cybersport: 'Cybersport',
      education: 'Education',
      films: 'Films',
      podcasts: 'Podcasts',
      mixes: 'Mixes',
      uncategorized: 'Uncategorized',
    },

    visibility: {
      public: 'Public',
      private: 'Private',
      unlisted: 'Unlisted',
    },
  },

  layout: {
    toggleNavigation:
      'Toggle navigation',

    homeAria:
      'AMTLIS home',

    searchPlaceholder:
      'Search videos, channels and playlists',

    searchAria:
      'Search',

    openProfile:
      'Open profile',

    yourContent:
      'Your content',

    navigation: {
      home: 'Home',
      playme: 'Playme',
      subscriptions: 'Subscriptions',
      library: 'Library',
      history: 'History',
      favorites: 'Favorites',
      playlists: 'Playlists',
      streamers: 'Streamers',
      themes: 'Themes',
    },
  },

  home: {
    categories: {
      all: 'All',
      music: 'Music',
      games: 'Games',
      cybersport: 'Cybersport',
      education: 'Education',
      films: 'Films',
      podcasts: 'Podcasts',
      mixes: 'Mixes',
    },

    hero: {
      original: {
        label: 'AMTLIS ORIGINAL',
        title:
          'Discover a new world of video',
        description:
          'Watch stories, streams, music and creators you love. Discover something new every day.',
      },

      live: {
        label: 'LIVE NOW',
        title:
          'The biggest moments are happening now',
        description:
          'Watch creators, tournaments and live events together with the AMTLIS community.',
      },

      trending: {
        label: 'TRENDING',
        title:
          'Find what everyone is watching',
        description:
          'Explore popular videos, new releases and creators that are growing right now.',
      },

      watchNow: 'Watch now',
      myList: 'My list',
      openSlide:
        'Open hero slide {{number}}',
    },

    sections: {
      top10: 'Top 10',
      continueWatching:
        'Continue Watching',
      popular: 'Popular',
      popularIn:
        'Popular in {{category}}',
      allVideos: 'All Videos',
    },

    loadingVideos:
      'Loading videos...',

    loadingHistory:
      'Loading watch history...',

    videosLoadFailed:
      'Videos could not be loaded.',

    historyLoadFailed:
      'Watch history could not be loaded.',

    apiHint:
      'Check that the API is running and try again.',

    noVideos:
      'No videos found.',

    noVideosCategory:
      'There are no videos in this category yet.',

    nothingToContinue:
      'Nothing to continue yet.',

    continueHint:
      'Start watching a video and your playback progress will appear here.',

    notPublished:
      'Not published',

    views_one:
      '{{formatted}} view',

    views_other:
      '{{formatted}} views',

    previousSection:
      'Previous {{title}}',

    nextSection:
      'Next {{title}}',
  },

  watch: {
    loadError:
      'The video could not be loaded.',

    unavailable:
      'Video unavailable',

    missingId:
      'Video identifier is missing.',

    notFound:
      'The requested video does not exist.',

    backHome:
      'Back to Home',

    loading:
      'Loading video...',

    notPublished:
      'Not published',

    views_one:
      '{{formatted}} view',

    views_other:
      '{{formatted}} views',

    channel:
      'Channel',

    upNext:
      'Up next',

    recommendations:
      'Recommendations',

    noRecommendations:
      'No recommendations are available yet.',
  },

  library: {
    eyebrow:
      'LIBRARY',

    yourContent:
      'YOUR CONTENT',

    video_one:
      '{{count}} video',

    video_other:
      '{{count}} videos',

    completed:
      'Completed',

    watched:
      '{{duration}} watched',

    uncategorized:
      'Uncategorized',

    remove:
      'Remove',

    removing:
      'Removing...',

    continue:
      'Continue',

    watch:
      'Watch',

    viewAll:
      'View all',

    open:
      'Open',

    page: {
      title:
        'Library',

      description:
        'Your recently watched, favorite and saved content in one place.',

      loading:
        'Loading library...',

      loadFailed:
        'Library failed to load',

      backendHint:
        'Make sure the backend is running and try again.',

      watchHistory:
        'Watch History',

      historyEmpty:
        'History is empty',

      historyEmptyHint:
        'Start watching videos and they will appear here.',

      favorites:
        'Favorites',

      favoritesEmpty:
        'No favorites yet',

      favoritesEmptyHint:
        'Videos added to Favorites will appear here.',

      playlists:
        'Playlists',

      integrationPoint:
        'Integration point',

      playlistsComing:
        'Playlists will appear here',

      playlistsHint:
        'Playlist functionality is implemented in a separate module and will be connected to Library through this section.',
    },

    history: {
      title:
        'Watch history',

      description:
        'Videos you recently watched and your current playback progress.',

      resume:
        'Resume history',

      pause:
        'Pause history',

      clear:
        'Clear history',

      searchPlaceholder:
        'Search watch history',

      loading:
        'Loading history...',

      loadFailed:
        'History failed to load',

      backendHint:
        'Make sure the backend is running and try again.',

      empty:
        'Your history is empty',

      emptyHint:
        'Start watching videos and they will appear here.',

      nothingFound:
        'Nothing found',

      noMatch:
        'No history items match “{{query}}”.',

      statusChangeFailed:
        'History status could not be changed.',

      removeFailed:
        'History item could not be removed.',

      clearFailed:
        'Watch history could not be cleared.',

      modalEyebrow:
        'WATCH HISTORY',

      modalTitle:
        'Clear watch history?',

      modalDescription:
        'All watched videos and saved playback progress will be removed from your history. This action cannot be undone.',

      cancel:
        'Cancel',

      clearing:
        'Clearing...',
    },

    favorites: {
      title:
        'Favorites',

      description:
        'Videos you saved to your personal favorites.',

      loading:
        'Loading favorites...',

      loadFailed:
        'Favorites failed to load',

      backendHint:
        'Make sure the backend is running and try again.',

      empty:
        'No favorite videos yet',

      emptyHint:
        'Videos you add to Favorites will appear here.',

      removeFailed:
        'Favorite could not be removed.',

      saved:
        'Saved {{date}}',
    },
  },
}

export default en
