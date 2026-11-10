import { ExternalLink, Icon, Modal } from '../components/ui'
import { getHelpLines, piecesOf } from '../content'
import { locale, t } from '../i18n'
import { closeHelp } from '../state/ui'
import { go } from '../state/router'

/**
 * "Necesito ayuda": se abre desde un botón siempre visible y llega a la llamada en 2 toques
 * (botón → número). No pide ningún dato ni pregunta qué pasó. Es una superposición: no cambia
 * la pantalla de fondo ni deja rastro en el historial.
 */
export function HelpModal() {
  const lines = getHelpLines()
  const sources = piecesOf('ayuda').flatMap((p) => p.sources)

  return (
    <Modal titleId="help-title" onClose={closeHelp} showHelp={false}>
      <p class="eyebrow">{t('help.eyebrow')}</p>
      <h2 id="help-title" tabIndex={-1}>
        {t('help.title')}
      </h2>
      <p>{t('help.intro')}</p>

      <ul class="calls">
        {lines.map((line) => {
          const text = line.locales[locale.value] ?? line.locales.es
          return (
            <li key={line.id}>
              <a class="help-call" href={`tel:${line.number}`}>
                <span>
                  <b>{t('help.call', { number: line.number })}</b>
                  <small>{text.label}</small>
                  {text.detail && <small>{text.detail}</small>}
                </span>
                <Icon name="phone" />
              </a>
              <p class="help-verify">
                {line.verifiedAt ? t('help.verified', { date: line.verifiedAt }) : t('help.unverified')}
              </p>
            </li>
          )
        })}
      </ul>

      <p class="source">{t('help.noSignal')}</p>

      <div class="actions">
        <button
          type="button"
          class="btn btn--alert"
          onClick={() => {
            closeHelp()
            go({ name: 'route' })
          }}
        >
          <Icon name="shield" />
          {t('help.route')}
        </button>
      </div>

      <p class="notice">{t('help.notReport')}</p>
      {sources.length > 0 && (
        <p class="source">
          {t('help.sources')}:{' '}
          {sources.map((s, i) => (
            <span key={s.label}>
              {i > 0 && ' · '}
              {s.url ? <ExternalLink href={s.url}>{s.label}</ExternalLink> : s.label}
            </span>
          ))}
        </p>
      )}
    </Modal>
  )
}
