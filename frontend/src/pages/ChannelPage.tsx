import {
  Link,
  useParams,
} from 'react-router-dom'
import {
  getFallbackChannels,
} from '../features/channels/channels'
import {
  useChannelStore,
} from '../features/channels/channelStore'
import {
  useAppTranslation,
} from '../i18n'
import './ChannelsPages.css'

function ChannelPage() {
  const { channelId = '' } = useParams()
  const { t } = useAppTranslation()
  const channel = getFallbackChannels().find((item) => item.id === channelId) ?? getFallbackChannels()[0]
  const isSubscribed = useChannelStore((state) => state.isSubscribed(channel.id))
  const toggleSubscription = useChannelStore((state) => state.toggleSubscription)

  return (
    <section className="channels-page">
      <Link className="channel-back" to="/subscriptions">← {t('system.channels.back')}</Link>
      <div className="channel-profile-hero">
        <div className="channel-page-avatar channel-page-avatar-large">{channel.name.charAt(0)}</div>
        <div>
          <p className="channel-eyebrow">CHANNEL</p>
          <h1>{channel.name}</h1>
          <p>{channel.subscribers} {t('system.channels.subscribers')}</p>
          <p className="channel-description">{channel.description}</p>
        </div>
        <button className={`subscribe-button ${isSubscribed ? 'is-subscribed' : ''}`} type="button" onClick={() => toggleSubscription(channel.id)}>
          {isSubscribed ? t('system.channels.subscribed') : t('system.channels.subscribe')}
        </button>
      </div>
      <div className="channel-videos-empty">
        <h2>{t('system.channels.videosTitle')}</h2>
        <p>{t('system.channels.videosLead')}</p>
      </div>
    </section>
  )
}

export default ChannelPage
