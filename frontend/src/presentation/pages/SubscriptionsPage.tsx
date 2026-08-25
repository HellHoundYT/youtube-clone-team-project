import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'
import type {
  VideoService,
} from '../../application/video/service'
import {
  getChannelsFromVideos,
  type ChannelSummary,
} from '../features/channels/channels'
import {
  useChannelStore,
} from '../features/channels/channelStore'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './ChannelsPages.css'

function ChannelAvatar({
  channel,
}: {
  channel: ChannelSummary
}) {
  return (
    <div className="channel-page-avatar">
      {channel.avatarPath ? (
        <img src={channel.avatarPath} alt="" />
      ) : (
        channel.name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

interface SubscriptionsPageProps {
  videoService: VideoService
}

function SubscriptionsPage({
  videoService,
}: SubscriptionsPageProps) {
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const subscribedIds = useChannelStore((state) => state.subscribedChannelIds)
  const toggleSubscription = useChannelStore((state) => state.toggleSubscription)
  const [channels, setChannels] = useState<ChannelSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    void videoService.getVideos({ page: 1, pageSize: 48 }, controller.signal)
      .then((videos) => setChannels(getChannelsFromVideos(videos)))
      .catch(() => setChannels(getChannelsFromVideos([])))
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [
    videoService,
  ])

  const subscribedChannels = useMemo(
    () => channels.filter((channel) => subscribedIds.includes(channel.id)),
    [channels, subscribedIds],
  )

  return (
    <section className="channels-page">
      <div className="channels-heading">
        <div>
          <p className="channel-eyebrow">AMTLIS</p>
          <h1>{t('system.channels.subscriptionsTitle')}</h1>
          <p>{t('system.channels.subscriptionsLead')}</p>
        </div>
        <span className="channel-count">
          {t('system.channels.channelCount', { count: subscribedIds.length })}
        </span>
      </div>

      {isLoading ? (
        <div className="channels-loading">{t('system.channels.loading')}</div>
      ) : subscribedChannels.length === 0 ? (
        <div className="channels-empty">
          <h2>{t('system.channels.emptyTitle')}</h2>
          <p>{t('system.channels.emptyLead')}</p>
        </div>
      ) : (
        <div className="channel-grid">
          {subscribedChannels.map((channel) => (
            <article className="channel-card" key={channel.id}>
              <button className="channel-card-main" type="button" onClick={() => navigate(`/channels/${channel.id}`)}>
                <ChannelAvatar channel={channel} />
                <h2>{channel.name}</h2>
                <p>{channel.description}</p>
                <span>{channel.subscribers} {t('system.channels.subscribers')}</span>
              </button>
              <div className="subscription-card-actions">
                <span className="subscribe-button is-subscribed">
                  {t('system.channels.subscribed')}
                </span>
                <button className="unsubscribe-button" type="button" onClick={() => toggleSubscription(channel.id)}>
                  {t('system.channels.unsubscribe')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="channel-discover">
        <h2>{t('system.channels.discoverTitle')}</h2>
        <div className="channel-grid">
          {channels.filter((channel) => !subscribedIds.includes(channel.id)).map((channel) => (
            <article className="channel-card" key={channel.id}>
              <button className="channel-card-main" type="button" onClick={() => navigate(`/channels/${channel.id}`)}>
                <ChannelAvatar channel={channel} />
                <h2>{channel.name}</h2>
                <p>{channel.description}</p>
                <span>{channel.subscribers} {t('system.channels.subscribers')}</span>
              </button>
              <button className="subscribe-button" type="button" onClick={() => toggleSubscription(channel.id)}>
                {t('system.channels.subscribe')}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default SubscriptionsPage
