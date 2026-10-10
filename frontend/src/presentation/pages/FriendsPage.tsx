import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import type {
  SocialService,
} from '../../application/social/service'
import type {
  FriendRequest,
  SocialNotification,
  SocialOverview,
  SocialUser,
} from '../../domain/social/types'
import {
  useAppTranslation,
} from '../../shared/i18n'
import {
  useSocialStore,
} from '../features/social/socialStore'
import './FriendsPage.css'

type SocialTab =
  | 'friends'
  | 'requests'
  | 'discover'
  | 'notifications'

const tabs:
SocialTab[] = [
  'friends',
  'requests',
  'discover',
  'notifications',
]

function getInitials(
  user: SocialUser,
) {
  return user.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SocialAvatar({
  user,
}: {
  user: SocialUser
}) {
  return (
    <div className="social-avatar">
      {user.avatarUrl
        ? (
          <img
            src={user.avatarUrl}
            alt=""
          />
        )
        : getInitials(user)}
    </div>
  )
}

interface FriendsPageProps {
  socialService:
    SocialService
}

function FriendsPage({
  socialService,
}: FriendsPageProps) {
  const navigate =
    useNavigate()

  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams()

  const {
    t,
    i18n,
  } =
    useAppTranslation()

  const setUnreadCount =
    useSocialStore(
      (state) =>
        state.setUnreadCount,
    )

  const refreshUnreadCount =
    useSocialStore(
      (state) =>
        state.refreshUnreadCount,
    )

  const tabParam =
    searchParams.get(
      'tab',
    )

  const activeTab:
    SocialTab =
    tabs.includes(
      tabParam as SocialTab,
    )
      ? tabParam as SocialTab
      : 'friends'

  const [
    overview,
    setOverview,
  ] =
    useState<
      SocialOverview | null
    >(null)

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      SocialNotification[]
    >([])

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState('')

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<
      SocialUser[]
    >([])

  const [
    searchStarted,
    setSearchStarted,
  ] =
    useState(false)

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    isSearching,
    setIsSearching,
  ] =
    useState(false)

  const [
    actionId,
    setActionId,
  ] =
    useState<
      string | null
    >(null)

  const [
    error,
    setError,
  ] =
    useState('')

  const locale =
    i18n.resolvedLanguage
      ?.toLowerCase()
      .startsWith(
        'uk',
      )
      ? 'uk-UA'
      : 'en-US'

  const formatDate =
    useCallback(
      (
        value: string,
      ) =>
        new Intl.DateTimeFormat(
          locale,
          {
            dateStyle:
              'medium',
            timeStyle:
              'short',
          },
        ).format(
          new Date(
            value,
          ),
        ),
      [
        locale,
      ],
    )

  const loadOverview =
    useCallback(
      async () => {
        const nextOverview =
          await socialService
            .getOverview()

        setOverview(
          nextOverview,
        )

        setUnreadCount(
          nextOverview
            .unreadNotificationCount,
        )
      },
      [
        setUnreadCount,
        socialService,
      ],
    )

  const loadNotifications =
    useCallback(
      async () => {
        const items =
          await socialService
            .getNotifications(
              60,
            )

        setNotifications(
          items,
        )
      },
      [
        socialService,
      ],
    )

  useEffect(
    () => {
      let disposed =
        false

      const load =
        async () => {
          try {
            setIsLoading(
              true,
            )

            setError(
              '',
            )

            const [
              nextOverview,
              nextNotifications,
            ] =
              await Promise.all([
                socialService
                  .getOverview(),
                socialService
                  .getNotifications(
                    60,
                  ),
              ])

            if (disposed) {
              return
            }

            setOverview(
              nextOverview,
            )

            setNotifications(
              nextNotifications,
            )

            setUnreadCount(
              nextOverview
                .unreadNotificationCount,
            )
          } catch {
            if (!disposed) {
              setError(
                t(
                  'social.requestFailed',
                ),
              )
            }
          } finally {
            if (!disposed) {
              setIsLoading(
                false,
              )
            }
          }
        }

      void load()

      return () => {
        disposed =
          true
      }
    },
    [
      setUnreadCount,
      socialService,
      t,
    ],
  )

  const setTab =
    (
      tab: SocialTab,
    ) => {
      if (
        tab ===
        'friends'
      ) {
        setSearchParams(
          {},
        )

        return
      }

      setSearchParams(
        {
          tab,
        },
      )
    }

  const refreshAfterAction =
    useCallback(
      async () => {
        await loadOverview()

        if (
          searchStarted
        ) {
          const users =
            await socialService
              .searchUsers(
                searchQuery,
              )

          setSearchResults(
            users,
          )
        }

        await refreshUnreadCount()
      },
      [
        loadOverview,
        refreshUnreadCount,
        searchQuery,
        searchStarted,
        socialService,
      ],
    )

  const runAction =
    async (
      id: string,
      action:
        () => Promise<unknown>,
    ) => {
      if (actionId) {
        return
      }

      try {
        setActionId(
          id,
        )

        setError(
          '',
        )

        await action()

        await refreshAfterAction()
      } catch {
        setError(
          t(
            'social.requestFailed',
          ),
        )
      } finally {
        setActionId(
          null,
        )
      }
    }

  const handleSearch =
    async (
      event?:
        FormEvent<HTMLFormElement>,
    ) => {
      event?.preventDefault()

      try {
        setIsSearching(
          true,
        )

        setError(
          '',
        )

        setSearchStarted(
          true,
        )

        const users =
          await socialService
            .searchUsers(
              searchQuery,
            )

        setSearchResults(
          users,
        )
      } catch {
        setError(
          t(
            'social.requestFailed',
          ),
        )
      } finally {
        setIsSearching(
          false,
        )
      }
    }

  const outgoingRequestMap =
    useMemo(
      () =>
        new Map(
          overview
            ?.outgoingRequests
            .map(
              (request) => [
                request.user.id,
                request,
              ],
            ) ??
            [],
        ),
      [
        overview,
      ],
    )

  const renderUserIdentity =
    (
      user: SocialUser,
    ) => (
      <div className="social-user-identity">
        <SocialAvatar
          user={
            user
          }
        />

        <div>
          <strong>
            {
              user.displayName
            }
          </strong>

          <span>
            {
              user.handle
            }
          </span>
        </div>
      </div>
    )

  const renderIncomingRequest =
    (
      request:
        FriendRequest,
    ) => (
      <article
        className="social-card"
        key={
          request.id
        }
      >
        {
          renderUserIdentity(
            request.user,
          )
        }

        <span className="social-card-meta">
          {formatDate(
            request.createdAt,
          )}
        </span>

        <div className="social-card-actions">
          <button
            type="button"
            className="social-primary-button"
            disabled={
              actionId ===
              request.id
            }
            onClick={() => {
              void runAction(
                request.id,
                () =>
                  socialService
                    .acceptFriendRequest(
                      request.id,
                    ),
              )
            }}
          >
            {t(
              'social.requests.accept',
            )}
          </button>

          <button
            type="button"
            className="social-secondary-button"
            disabled={
              actionId ===
              request.id
            }
            onClick={() => {
              void runAction(
                request.id,
                () =>
                  socialService
                    .rejectFriendRequest(
                      request.id,
                    ),
              )
            }}
          >
            {t(
              'social.requests.reject',
            )}
          </button>
        </div>
      </article>
    )

  const getNotificationText =
    (
      notification:
        SocialNotification,
    ) => {
      const name =
        notification
          .actor
          ?.displayName ??
        'AMTLIS'

      if (
        notification.type ===
        'FriendRequest'
      ) {
        return t(
          'social.notifications.friendRequest',
          {
            name,
          },
        )
      }

      if (
        notification.type ===
        'FriendAccepted'
      ) {
        return t(
          'social.notifications.friendAccepted',
          {
            name,
          },
        )
      }

      if (
        notification.type ===
        'WatchPartyInvite'
      ) {
        return t(
          'social.notifications.watchPartyInvite',
          {
            name,
            roomCode:
              notification
                .roomCode ??
              '',
          },
        )
      }

      return t(
        'social.notifications.generic',
      )
    }

  const handleOpenNotification =
    async (
      notification:
        SocialNotification,
    ) => {
      try {
        if (
          !notification.readAt
        ) {
          await socialService
            .markNotificationRead(
              notification.id,
            )
        }

        await Promise.all([
          loadNotifications(),
          loadOverview(),
        ])

        if (
          notification
            .targetPath
        ) {
          navigate(
            notification
              .targetPath,
          )
        }
      } catch {
        setError(
          t(
            'social.requestFailed',
          ),
        )
      }
    }

  if (
    isLoading &&
    !overview
  ) {
    return (
      <section className="social-page">
        <div className="social-loading">
          {t(
            'social.loading',
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="social-page">
      <header className="social-hero">
        <div>
          <span>
            {t(
              'social.eyebrow',
            )}
          </span>

          <h1>
            {t(
              'social.title',
            )}
          </h1>

          <p>
            {t(
              'social.lead',
            )}
          </p>
        </div>

        <div className="social-summary">
          <span>
            {t(
              'social.counts.friends',
              {
                count:
                  overview
                    ?.friends
                    .length ??
                  0,
              },
            )}
          </span>

          <span>
            {t(
              'social.counts.incoming',
              {
                count:
                  overview
                    ?.incomingRequests
                    .length ??
                  0,
              },
            )}
          </span>

          <span>
            {t(
              'social.counts.unread',
              {
                count:
                  overview
                    ?.unreadNotificationCount ??
                  0,
              },
            )}
          </span>
        </div>
      </header>

      <nav className="social-tabs">
        {tabs.map(
          (tab) => (
            <button
              key={
                tab
              }
              type="button"
              className={
                activeTab ===
                tab
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                setTab(
                  tab,
                )
              }
            >
              {t(
                `social.tabs.${tab}`,
              )}

              {tab ===
                'requests' &&
                (
                  overview
                    ?.incomingRequests
                    .length ??
                  0
                ) >
                  0 && (
                  <span>
                    {
                      overview
                        ?.incomingRequests
                        .length
                    }
                  </span>
                )}

              {tab ===
                'notifications' &&
                (
                  overview
                    ?.unreadNotificationCount ??
                  0
                ) >
                  0 && (
                  <span>
                    {
                      overview
                        ?.unreadNotificationCount
                    }
                  </span>
                )}
            </button>
          ),
        )}
      </nav>

      {error && (
        <div
          className="social-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {activeTab ===
        'friends' && (
        <div className="social-section">
          {(
            overview
              ?.friends
              .length ??
            0
          ) === 0
            ? (
              <div className="social-empty">
                <h2>
                  {t(
                    'social.friends.emptyTitle',
                  )}
                </h2>

                <p>
                  {t(
                    'social.friends.emptyLead',
                  )}
                </p>

                <button
                  type="button"
                  className="social-primary-button"
                  onClick={() =>
                    setTab(
                      'discover',
                    )
                  }
                >
                  {t(
                    'social.tabs.discover',
                  )}
                </button>
              </div>
            )
            : (
              <div className="social-grid">
                {overview
                  ?.friends
                  .map(
                    (
                      friend,
                    ) => (
                      <article
                        className="social-card"
                        key={
                          friend.id
                        }
                      >
                        {
                          renderUserIdentity(
                            friend,
                          )
                        }

                        <span className="social-status is-friends">
                          {t(
                            'social.status.friends',
                          )}
                        </span>

                        <button
                          type="button"
                          className="social-secondary-button"
                          disabled={
                            actionId ===
                            friend.id
                          }
                          onClick={() => {
                            if (
                              !window.confirm(
                                t(
                                  'social.friends.removeConfirm',
                                  {
                                    name:
                                      friend.displayName,
                                  },
                                ),
                              )
                            ) {
                              return
                            }

                            void runAction(
                              friend.id,
                              () =>
                                socialService
                                  .removeFriend(
                                    friend.id,
                                  ),
                            )
                          }}
                        >
                          {t(
                            'social.friends.remove',
                          )}
                        </button>
                      </article>
                    ),
                  )}
              </div>
            )}
        </div>
      )}

      {activeTab ===
        'requests' && (
        <div className="social-request-columns">
          <section className="social-section">
            <div className="social-section-heading">
              <h2>
                {t(
                  'social.requests.incomingTitle',
                )}
              </h2>
            </div>

            {(
              overview
                ?.incomingRequests
                .length ??
              0
            ) === 0
              ? (
                <div className="social-empty compact">
                  <p>
                    {t(
                      'social.requests.emptyIncoming',
                    )}
                  </p>
                </div>
              )
              : (
                <div className="social-list">
                  {overview
                    ?.incomingRequests
                    .map(
                      renderIncomingRequest,
                    )}
                </div>
              )}
          </section>

          <section className="social-section">
            <div className="social-section-heading">
              <h2>
                {t(
                  'social.requests.outgoingTitle',
                )}
              </h2>
            </div>

            {(
              overview
                ?.outgoingRequests
                .length ??
              0
            ) === 0
              ? (
                <div className="social-empty compact">
                  <p>
                    {t(
                      'social.requests.emptyOutgoing',
                    )}
                  </p>
                </div>
              )
              : (
                <div className="social-list">
                  {overview
                    ?.outgoingRequests
                    .map(
                      (
                        request,
                      ) => (
                        <article
                          className="social-card"
                          key={
                            request.id
                          }
                        >
                          {
                            renderUserIdentity(
                              request.user,
                            )
                          }

                          <span className="social-card-meta">
                            {formatDate(
                              request.createdAt,
                            )}
                          </span>

                          <button
                            type="button"
                            className="social-secondary-button"
                            disabled={
                              actionId ===
                              request.id
                            }
                            onClick={() => {
                              void runAction(
                                request.id,
                                () =>
                                  socialService
                                    .cancelFriendRequest(
                                      request.id,
                                    ),
                              )
                            }}
                          >
                            {t(
                              'social.requests.cancel',
                            )}
                          </button>
                        </article>
                      ),
                    )}
                </div>
              )}
          </section>
        </div>
      )}

      {activeTab ===
        'discover' && (
        <section className="social-section">
          <div className="social-section-heading">
            <div>
              <h2>
                {t(
                  'social.search.title',
                )}
              </h2>

              <p>
                {t(
                  'social.search.lead',
                )}
              </p>
            </div>
          </div>

          <form
            className="social-search"
            onSubmit={
              handleSearch
            }
          >
            <input
              value={
                searchQuery
              }
              placeholder={t(
                'social.search.placeholder',
              )}
              onChange={(
                event,
              ) =>
                setSearchQuery(
                  event.target
                    .value,
                )
              }
            />

            <button
              type="submit"
              className="social-primary-button"
              disabled={
                isSearching
              }
            >
              {t(
                'social.search.button',
              )}
            </button>
          </form>

          {!searchStarted
            ? (
              <div className="social-empty compact">
                <p>
                  {t(
                    'social.search.start',
                  )}
                </p>
              </div>
            )
            : searchResults.length ===
                0
              ? (
                <div className="social-empty compact">
                  <p>
                    {t(
                      'social.search.empty',
                    )}
                  </p>
                </div>
              )
              : (
                <div className="social-grid social-search-results">
                  {searchResults.map(
                    (
                      user,
                    ) => {
                      const outgoingRequest =
                        outgoingRequestMap.get(
                          user.id,
                        )

                      return (
                        <article
                          className="social-card"
                          key={
                            user.id
                          }
                        >
                          {
                            renderUserIdentity(
                              user,
                            )
                          }

                          <span className={`social-status is-${user.relationshipStatus}`}>
                            {t(
                              `social.status.${user.relationshipStatus}`,
                            )}
                          </span>

                          {user.relationshipStatus ===
                            'none' && (
                            <button
                              type="button"
                              className="social-primary-button"
                              disabled={
                                actionId ===
                                user.id
                              }
                              onClick={() => {
                                void runAction(
                                  user.id,
                                  () =>
                                    socialService
                                      .sendFriendRequest(
                                        user.id,
                                      ),
                                )
                              }}
                            >
                              {t(
                                'social.actions.add',
                              )}
                            </button>
                          )}

                          {user.relationshipStatus ===
                            'pendingOutgoing' &&
                            outgoingRequest && (
                            <button
                              type="button"
                              className="social-secondary-button"
                              disabled={
                                actionId ===
                                outgoingRequest.id
                              }
                              onClick={() => {
                                void runAction(
                                  outgoingRequest.id,
                                  () =>
                                    socialService
                                      .cancelFriendRequest(
                                        outgoingRequest.id,
                                      ),
                                )
                              }}
                            >
                              {t(
                                'social.requests.cancel',
                              )}
                            </button>
                          )}

                          {user.relationshipStatus ===
                            'pendingIncoming' && (
                            <button
                              type="button"
                              className="social-secondary-button"
                              onClick={() =>
                                setTab(
                                  'requests',
                                )
                              }
                            >
                              {t(
                                'social.requests.review',
                              )}
                            </button>
                          )}

                          {user.relationshipStatus ===
                            'friends' && (
                            <button
                              type="button"
                              className="social-secondary-button"
                              disabled
                            >
                              {t(
                                'social.actions.friends',
                              )}
                            </button>
                          )}
                        </article>
                      )
                    },
                  )}
                </div>
              )}
        </section>
      )}

      {activeTab ===
        'notifications' && (
        <section className="social-section">
          <div className="social-section-heading">
            <div>
              <h2>
                {t(
                  'social.notifications.title',
                )}
              </h2>

              <p>
                {t(
                  'social.notifications.lead',
                )}
              </p>
            </div>

            {notifications.some(
              (
                notification,
              ) =>
                !notification
                  .readAt,
            ) && (
              <button
                type="button"
                className="social-secondary-button"
                onClick={() => {
                  void (
                    async () => {
                      try {
                        await socialService
                          .markAllNotificationsRead()

                        await Promise.all([
                          loadNotifications(),
                          loadOverview(),
                        ])
                      } catch {
                        setError(
                          t(
                            'social.requestFailed',
                          ),
                        )
                      }
                    }
                  )()
                }}
              >
                {t(
                  'social.notifications.markAll',
                )}
              </button>
            )}
          </div>

          {notifications.length ===
            0
            ? (
              <div className="social-empty compact">
                <p>
                  {t(
                    'social.notifications.empty',
                  )}
                </p>
              </div>
            )
            : (
              <div className="social-notification-list">
                {notifications.map(
                  (
                    notification,
                  ) => (
                    <article
                      className={`social-notification ${
                        notification.readAt
                          ? ''
                          : 'is-unread'
                      }`}
                      key={
                        notification.id
                      }
                    >
                      {notification
                        .actor
                        ? (
                          <SocialAvatar
                            user={
                              notification.actor
                            }
                          />
                        )
                        : (
                          <div className="social-avatar">
                            AM
                          </div>
                        )}

                      <div className="social-notification-copy">
                        <div>
                          <strong>
                            {
                              getNotificationText(
                                notification,
                              )
                            }
                          </strong>

                          {!notification
                            .readAt && (
                            <span>
                              {t(
                                'social.notifications.unread',
                              )}
                            </span>
                          )}
                        </div>

                        <time>
                          {formatDate(
                            notification.createdAt,
                          )}
                        </time>
                      </div>

                      {(notification
                        .targetPath ||
                        !notification
                          .readAt) && (
                        <button
                          type="button"
                          className="social-secondary-button"
                          onClick={() => {
                            void handleOpenNotification(
                              notification,
                            )
                          }}
                        >
                          {t(
                            'social.notifications.open',
                          )}
                        </button>
                      )}
                    </article>
                  ),
                )}
              </div>
            )}
        </section>
      )}
    </section>
  )
}

export default FriendsPage
