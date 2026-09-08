import {
  Link,
  useParams,
} from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { ChannelService } from '../../application/channel/service'
import type { Channel } from '../../domain/channel/types'
import {
  useAppTranslation,
} from '../../shared/i18n'
import './ChannelsPages.css'

function ChannelPage({ channelService }: { channelService: ChannelService }) {
  const { channelId = '' } = useParams()
  const { t } = useAppTranslation()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!channelId) return
    void channelService.getChannel(channelId).then(setChannel).catch(() => setFailed(true))
  }, [channelId, channelService])

  if (failed) return <section className="channels-page"><div className="channels-empty">Channel unavailable</div></section>
  if (!channel) return <section className="channels-page"><div className="channels-loading">{t('system.channels.loading')}</div></section>

  return (
    <section className="channels-page">
      <Link className="channel-back" to="/subscriptions">← {t('system.channels.back')}</Link>
      <div className="channel-profile-hero">
        <div className="channel-page-avatar channel-page-avatar-large">{channel.avatarPath ? <img src={channel.avatarPath} alt="" /> : channel.name.charAt(0)}</div>
        <div>
          <p className="channel-eyebrow">CHANNEL</p>
          <h1>{channel.name}</h1>
          <p>{channel.handle} · {channel.subscriberCount} {t('system.channels.subscribers')}</p>
          <p className="channel-description">{channel.description}</p>
        </div>
      </div>
      <div className="channel-videos-empty">
        <h2>{t('system.channels.videosTitle')}</h2>
        <p>{t('system.channels.videosLead')}</p>
      </div>
    </section>
  )
}

export default ChannelPage
