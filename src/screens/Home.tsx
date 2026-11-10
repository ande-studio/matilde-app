import { Icon, ScreenTitle, type IconName } from '../components/ui'
import { t, type MessageKey } from '../i18n'
import { go, type Route } from '../state/router'

interface Tile {
  icon: IconName
  title: MessageKey
  desc: MessageKey
  to: Route
  alert?: boolean
}

const TILES: Tile[] = [
  { icon: 'shield', title: 'home.route.title', desc: 'home.route.desc', to: { name: 'route' }, alert: true },
  { icon: 'book', title: 'home.guides.title', desc: 'home.guides.desc', to: { name: 'guides' } },
  { icon: 'present', title: 'home.share.title', desc: 'home.share.desc', to: { name: 'share' } },
  { icon: 'chat', title: 'home.phrases.title', desc: 'home.phrases.desc', to: { name: 'phrases' } },
  { icon: 'cap', title: 'home.training.title', desc: 'home.training.desc', to: { name: 'training' } },
]

export function Home() {
  return (
    <>
      <ScreenTitle>{t('home.title')}</ScreenTitle>
      <p class="lead">{t('home.subtitle')}</p>
      <div class="tiles">
        {TILES.map((tile) => (
          <button
            type="button"
            key={tile.title}
            class={`tile${tile.alert ? ' tile--alert' : ''}`}
            onClick={() => go(tile.to)}
          >
            <Icon name={tile.icon} />
            <span class="tile-text">
              <strong>{t(tile.title)}</strong>
              <span>{t(tile.desc)}</span>
            </span>
            <Icon name="chevron" />
          </button>
        ))}
      </div>
      <p class="muted small">{t('home.privacy')}</p>
    </>
  )
}
