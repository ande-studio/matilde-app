import type { ComponentChildren } from 'preact'
import { useEffect } from 'preact/hooks'
import { contentMeta } from '../content'
import { locale, t, type MessageKey } from '../i18n'
import { quickExit } from '../lib/exit'
import { HelpModal } from '../screens/Help'
import { applyUpdate, offlineReady, updateReady } from '../state/pwa'
import { setLocale } from '../state/prefs'
import { goRoot, route, type Route } from '../state/router'
import { helpOpen, languageOpen, openHelp } from '../state/ui'
import { Icon, Modal, Wordmark, type IconName } from './ui'

type Section = 'home' | 'explore' | 'chat' | 'share' | 'settings'

interface NavItem {
  section: Exclude<Section, 'settings'>
  icon: IconName
  label: MessageKey
  short: MessageKey
  to: Route
}

const NAV: NavItem[] = [
  { section: 'home', icon: 'home', label: 'nav.home', short: 'nav.home.short', to: { name: 'home' } },
  { section: 'explore', icon: 'book', label: 'nav.guides', short: 'nav.guides.short', to: { name: 'guides' } },
  { section: 'chat', icon: 'flower', label: 'nav.chat', short: 'nav.chat.short', to: { name: 'matilde' } },
  { section: 'share', icon: 'heart', label: 'nav.share', short: 'nav.share.short', to: { name: 'share' } },
]

function sectionOf(name: Route['name']): Section {
  switch (name) {
    case 'guides':
    case 'guide':
    case 'training':
    case 'lesson':
    case 'phrases':
      return 'explore'
    case 'matilde':
      return 'chat'
    case 'share':
    case 'share-view':
      return 'share'
    case 'settings':
      return 'settings'
    default:
      return 'home'
  }
}

function crumbOf(current: Route, section: Section): string {
  if (current.name === 'route') return t('route.title')
  if (section === 'settings') return t('nav.settings')
  return t(NAV.find((n) => n.section === section)?.label ?? 'nav.home')
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

/** Un único botón "Necesito ayuda" en el DOM: en escritorio vive en la barra lateral y en móvil flota sobre la navegación. */
function HelpButton() {
  return (
    <button type="button" class="help-side" onClick={openHelp}>
      <span class="help-side__label">
        <Icon name="heart" />
        {t('action.help')}
      </span>
      <Icon name="external" />
    </button>
  )
}

function LanguageModal() {
  const close = () => (languageOpen.value = false)
  const choose = (value: 'es' | 'qu') => {
    setLocale(value)
    close()
  }
  return (
    <Modal titleId="language-title" onClose={close}>
      <h2 id="language-title" tabIndex={-1}>
        {t('language.title')}
      </h2>
      <p>{t('language.body')}</p>
      <div class="choices">
        <button type="button" class="choice" lang="es" onClick={() => choose('es')}>
          {t('language.es.long')}
          <Icon name={locale.value === 'es' ? 'check' : 'arrow'} />
        </button>
        <button type="button" class="choice" lang="qu-PE" onClick={() => choose('qu')}>
          {t('language.qu.long')}
          <Icon name={locale.value === 'qu' ? 'check' : 'arrow'} />
        </button>
      </div>
      <p class="notice">{t('banner.qu')}</p>
    </Modal>
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
      {!presenting && (
        <aside class="sidebar">
          <button type="button" class="brand" onClick={() => goRoot({ name: 'home' })} aria-label={t('app.name')}>
            <Wordmark />
          </button>
          <p class="brand-note">{t('app.tagline')}</p>

          <nav class="main-nav" aria-label={t('nav.main')}>
            {NAV.map((item) => (
              <button
                type="button"
                key={item.section}
                class="nav-item"
                aria-current={section === item.section ? 'page' : undefined}
                onClick={() => goRoot(item.to)}
              >
                <Icon name={item.icon} />
                <span class="nav-label">{t(item.label)}</span>
                <span class="nav-short" aria-hidden="true">
                  {t(item.short)}
                </span>
              </button>
            ))}
          </nav>

          <div class="side-bottom">
            <div class="safe-note">
              <Icon name="leaf" />
              <b>{t('side.safe.title')}</b>
              <p>{t('side.safe.body')}</p>
            </div>
            <button
              type="button"
              class="settings-btn"
              aria-current={section === 'settings' ? 'page' : undefined}
              onClick={() => goRoot({ name: 'settings' })}
            >
              <Icon name="sliders" />
              {t('nav.settings')}
            </button>
            <HelpButton />
          </div>
        </aside>
      )}

      <div class="shell">
        <header class="topbar">
          {!presenting && (
            <>
              <button type="button" class="mobile-wordmark" onClick={() => goRoot({ name: 'home' })} aria-label={t('app.name')}>
                <Wordmark />
              </button>
              <div class="crumb">
                {t('crumb.space')}
                <span class="crumb-sep" aria-hidden="true">
                  /
                </span>
                <b>{crumbOf(current, section)}</b>
              </div>
            </>
          )}
          <div class="topbar-actions">
            {!presenting && (
              <>
                <button
                  type="button"
                  class="mobile-profile"
                  aria-label={t('nav.settings')}
                  onClick={() => goRoot({ name: 'settings' })}
                >
                  <Icon name="user" />
                </button>
                <button type="button" class="lang-btn" aria-label={t('action.language.pick')} onClick={() => (languageOpen.value = true)}>
                  <Icon name="globe" />
                  <span class="lang-name">{t(locale.value === 'es' ? 'language.es' : 'language.qu')}</span>
                  <span class="lang-code">{locale.value.toUpperCase()}</span>
                  <Icon name="chevron-down" />
                </button>
              </>
            )}
            <button type="button" class="exit-btn" onClick={quickExit}>
              {t('action.exit')}
              <Icon name="external" />
            </button>
          </div>
        </header>

        <main class="main">
          {!presenting && <Banners />}
          {children}
        </main>

        {!presenting && (
          <footer class="footer">
            <span>{t('footer.left')}</span>
            <span>{t('footer.right')}</span>
          </footer>
        )}
      </div>

      {presenting && <HelpButton />}
      {helpOpen.value && <HelpModal />}
      {languageOpen.value && <LanguageModal />}
    </div>
  )
}
