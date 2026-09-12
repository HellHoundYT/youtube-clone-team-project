import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { channelsApi, type ApiChannel } from '../../infrastructure/api/channels'
import { useAuthStore } from '../features/auth/authStore'
import { useAppTranslation } from '../../shared/i18n'
import './ChannelsPages.css'

function ChannelPage() {
  const { channelId = '' } = useParams()
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const profile = useAuthStore((state) => state.profile)
  const [channel, setChannel] = useState<ApiChannel | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    void channelsApi.get(channelId).then(setChannel).catch(() => setChannel(null))
    if (profile) void channelsApi.subscriptions().then((items) => setIsSubscribed(items.some((item) => item.id === channelId))).catch(() => setIsSubscribed(false))
  }, [channelId, profile])

  const toggleSubscription = async () => {
    if (!profile) { navigate('/auth', { state: { from: `/channels/${channelId}` } }); return }
    if (isSubscribed) await channelsApi.unsubscribe(channelId)
    else await channelsApi.subscribe(channelId)
    setIsSubscribed(!isSubscribed)
    setChannel(await channelsApi.get(channelId))
  }

  if (!channel) return null

  return <section className="channels-page">
    <Link className="channel-back" to="/subscriptions">← {t('system.channels.back')}</Link>
    <div className="channel-profile-hero">
      <div className="channel-page-avatar channel-page-avatar-large">{channel.name.charAt(0)}</div>
      <div><p className="channel-eyebrow">CHANNEL</p><h1>{channel.name}</h1><p>{channel.subscriberCount} {t('system.channels.subscribers')}</p><p className="channel-description">{channel.description}</p></div>
      <button className={`subscribe-button ${isSubscribed ? 'is-subscribed' : ''}`} type="button" onClick={() => { void toggleSubscription() }}>{isSubscribed ? t('system.channels.subscribed') : t('system.channels.subscribe')}</button>
    </div>
    <div className="channel-videos-empty"><h2>{t('system.channels.videosTitle')}</h2><p>{t('system.channels.videosLead')}</p></div>
  </section>
}

export default ChannelPage
