import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { channelsApi, type ApiChannel } from '../../infrastructure/api/channels'
import { useAuthStore } from '../features/auth/authStore'
import { useAppTranslation } from '../../shared/i18n'
import './ChannelsPages.css'

function ChannelAvatar({ channel }: { channel: ApiChannel }) {
  return <div className="channel-page-avatar">{channel.avatarPath ? <img src={channel.avatarPath} alt="" /> : channel.name.charAt(0).toUpperCase()}</div>
}

function SubscriptionsPage() {
  const navigate = useNavigate()
  const { t } = useAppTranslation()
  const profile = useAuthStore((state) => state.profile)
  const [channels, setChannels] = useState<ApiChannel[]>([])
  const [subscribedIds, setSubscribedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const loadChannels = useCallback(async () => {
    const allChannels = await channelsApi.list()
    const subscriptions = profile ? await channelsApi.subscriptions() : []
    setChannels(allChannels)
    setSubscribedIds(subscriptions.map((channel) => channel.id))
  }, [profile])
  useEffect(() => {
    let isCurrent = true
    const load = async () => {
      try {
        await loadChannels()
      } catch {
        if (isCurrent) {
          setChannels([])
          setSubscribedIds([])
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }
    void load()
    return () => { isCurrent = false }
  }, [loadChannels])
  const toggleSubscription = async (channelId: string) => {
    if (!profile) { navigate('/auth', { state: { from: '/subscriptions' } }); return }
    setIsUpdating(channelId)
    try {
      if (subscribedIds.includes(channelId)) await channelsApi.unsubscribe(channelId)
      else await channelsApi.subscribe(channelId)
      await loadChannels()
    } finally { setIsUpdating(null) }
  }
  const subscribedChannels = useMemo(() => channels.filter((channel) => subscribedIds.includes(channel.id)), [channels, subscribedIds])
  const discoverChannels = useMemo(() => channels.filter((channel) => !subscribedIds.includes(channel.id)), [channels, subscribedIds])
  const ChannelCard = ({ channel, subscribed }: { channel: ApiChannel; subscribed: boolean }) => <article className="channel-card">
    <button className="channel-card-main" type="button" onClick={() => navigate(`/channels/${channel.id}`)}><ChannelAvatar channel={channel} /><h2>{channel.name}</h2><p>{channel.description}</p><span>{channel.subscriberCount} {t('system.channels.subscribers')}</span></button>
    {subscribed ? <div className="subscription-card-actions"><span className="subscribe-button is-subscribed">{t('system.channels.subscribed')}</span><button className="unsubscribe-button" type="button" disabled={isUpdating === channel.id} onClick={() => { void toggleSubscription(channel.id) }}>{t('system.channels.unsubscribe')}</button></div> : <button className="subscribe-button" type="button" disabled={isUpdating === channel.id} onClick={() => { void toggleSubscription(channel.id) }}>{t('system.channels.subscribe')}</button>}
  </article>
  return <section className="channels-page"><div className="channels-heading"><div><p className="channel-eyebrow">AMTLIS</p><h1>{t('system.channels.subscriptionsTitle')}</h1><p>{t('system.channels.subscriptionsLead')}</p></div><span className="channel-count">{t('system.channels.channelCount', { count: subscribedIds.length })}</span></div>{isLoading ? <div className="channels-loading">{t('system.channels.loading')}</div> : subscribedChannels.length === 0 ? <div className="channels-empty"><h2>{t('system.channels.emptyTitle')}</h2><p>{t('system.channels.emptyLead')}</p></div> : <div className="channel-grid">{subscribedChannels.map((channel) => <ChannelCard channel={channel} subscribed key={channel.id} />)}</div>}<section className="channel-discover"><h2>{t('system.channels.discoverTitle')}</h2><div className="channel-grid">{discoverChannels.map((channel) => <ChannelCard channel={channel} subscribed={false} key={channel.id} />)}</div></section></section>
}

export default SubscriptionsPage
