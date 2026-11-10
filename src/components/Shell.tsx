import type { ComponentChildren } from 'preact'
import { useEffect } from 'preact/hooks'
import { contentMeta } from '../content'
import { locale, t, type MessageKey } from '../i18n'
import { quickExit } from '../lib/exit'
import { applyUpdate, offlineReady, updateReady } from '../state/pwa'
import { setLocale } from '../state/prefs'
import { go, goRoot, route, type Route } from '../state/router'
import { Icon, type IconName } from './ui'

type Section = 'home' | 'guides' | 'share' | 'training' | 'settings'

const NAV: { section: Section; icon: IconName; label: MessageKey; to: Route }[] = [
  { section: 'home', icon: 'home', label: 'nav.home', to: { name: 'home' } },
  { section: 'guides', icon: 'book', label: 'nav.guides', to: { name: 'guides' } },
  { section: 'share', icon: 'present', label: 'nav.share', to: { name: 'share' } },
  { section: 'training', icon: 'cap', label: 'nav.training', to: { name: 'training' } },
  { section: 'settings', icon: 'sliders', label: 'nav.settings', to: { name: 'settings' } },
]

function sectionOf(name: Route['name']): Section {
  switch (name) {
    case 'guides':
    case 'guide':
      return 'guides'
    case 'share':
    case 'share-view':
      return 'share'
    case 'training':
    case 'lesson':
      return 'training'
    case 'settings':
      return 'settings'
    default:
      return 'home'
  }
}

/** Dos pulsaciones seguidas de Esc equivalen a "Salir rápido". */
function useEscapeTwice(): void {
  useEffect(() => {
    let last = 0
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const now = Date.now()
      if (now - last < 800) quickExit()
      last = now
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** Mueve el foco al título al cambiar de pantalla (accesibilidad) y vuelve al inicio del scroll. */
function useFocusOnNavigate(): void {
  const current = route.value
  useEffect(() => {
    window.scrollTo?.(0, 0)
    document.getElementById('main-heading')?.focus({ preventScroll: true })
  }, [current])
}

function Banners() {
  const channel = contentMeta.channel
  return (
    <div class="banners" role="region" aria-label={t('banner.region')}>
      {channel !== 'production' && (
        <p class="banner banner--warn">{t(channel === 'draft' ? 'banner.draft' : 'banner.review')}</p>
      )}
      {locale.value === 'qu' && <p class="banner banner--info">{t('banner.qu')}</p>}
      {updateReady.value && (
        <p class="banner banner--info">
          {t('banner.update')}{' '}
          <button type="button" class="link-button" onClick={() => void applyUpdate.value?.()}>
            {t('banner.update.apply')}
          </button>
        </p>
      )}
      {offlineReady.value && (
        <p class="banner banner--ok" role="status">
          {t('banner.offline')}{' '}
          <button type="button" class="link-button" onClick={() => (offlineReady.value = false)}>
            {t('action.close')}
          </button>
        </p>
      )}
    </div>
  )
}

export function Shell({ children }: { children: ComponentChildren }) {
  useEscapeTwice()
  useFocusOnNavigate()
  const current = route.value
  const presenting = current.name === 'share-view'
  const section = sectionOf(current.name)

  return (
    <div class={`app${presenting ? ' app--presenting' : ''}`}>
      <header class="topbar">
        {!presenting && (
          <button type="button" class="brand" onClick={() => goRoot({ name: 'home' })}>
            <img src="/matilde-flor.svg" alt="" width="28" height="31" />
            <span>
              {t('app.name')}
              <small>{t('app.tagline')}</small>
            </span>
          </button>
        )}
        <div class="topbar-actions">
          {!presenting && (
            <div class="segmented" role="group" aria-label={t('action.language')}>
              {(['es', 'qu'] as const).map((l) => (
                <button
                  type="button"
                  key={l}
                  lang={l === 'qu' ? 'qu-PE' : 'es'}
                  aria-pressed={locale.value === l}
                  onClick={() => setLocale(l)}
                >
                  {l.toUpperCase()}
                  <span class="visually-hidden"> {t(l === 'es' ? 'language.es' : 'language.qu')}</span>
                </button>
              ))}
            </div>
          )}
          <button type="button" class="btn btn--quiet" onClick={quickExit}>
            <Icon name="exit" />
            {t('action.exit')}
          </button>
        </div>
      </header>

      {!presenting && (
        <nav class="nav" aria-label={t('nav.main')}>
          {NAV.map((item) => (
            <button
              type="button"
              key={item.section}
              aria-current={section === item.section ? 'page' : undefined}
              onClick={() => goRoot(item.to)}
            >
              <Icon name={item.icon} />
              <span>{t(item.label)}</span>
            </button>
          ))}
        </nav>
      )}

      <main class="main">
        {!presenting && <Banners />}
        {children}
      </main>

      {current.name !== 'help' && (
        <button type="button" class="help-fab" onClick={() => go({ name: 'help' })}>
          <Icon name="heart" />
          {t('action.help')}
        </button>
      )}
    </div>
  )
}
