import { BackButton, ExternalLink, Icon, ScreenTitle } from '../components/ui'
import { piecesOf, getHelpLines } from '../content'
import { locale, t } from '../i18n'
import { go } from '../state/router'

/**
 * "Necesito ayuda": a 2 toques de llamar desde cualquier pantalla (botón fijo → llamada).
 * No pide ningún dato ni pregunta qué pasó.
 */
export function Help() {
  const lines = getHelpLines()
  const sources = piecesOf('ayuda').flatMap((p) => p.sources)

  return (
    <>
      <BackButton />
      <ScreenTitle>{t('help.title')}</ScreenTitle>
      <p class="lead">{t('help.intro')}</p>

      <ul class="calls">
        {lines.map((line) => {
          const text = line.locales[locale.value] ?? line.locales.es
          return (
            <li key={line.id}>
              <a class="call" href={`tel:${line.number}`}>
                <Icon name="phone" />
                <span class="call-text">
                  <strong>{t('help.call', { number: line.number })}</strong>
                  <span>{text.label}</span>
                  <span class="muted">{text.detail}</span>
                </span>
              </a>
              <p class="muted small">
                {line.verifiedAt ? t('help.verified', { date: line.verifiedAt }) : t('help.unverified')}
              </p>
            </li>
          )
        })}
      </ul>
      <p class="muted">{t('help.noSignal')}</p>

      <div class="actions">
        <button type="button" class="btn btn--alert" onClick={() => go({ name: 'route' })}>
          <Icon name="shield" />
          {t('help.route')}
        </button>
      </div>

      <p class="callout callout--info">{t('help.notReport')}</p>
      {sources.length > 0 && (
        <section class="block small">
          <h2>{t('help.sources')}</h2>
          <ul>
            {sources.map((s) => (
              <li key={s.label}>{s.url ? <ExternalLink href={s.url}>{s.label}</ExternalLink> : s.label}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
