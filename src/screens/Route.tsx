import { useState } from 'preact/hooks'
import type { HelpLine, Salida } from '../../schemas/content'
import { BackButton, Icon, ScreenTitle } from '../components/ui'
import { getHelpLines, getRuta } from '../content'
import { locale, t, tOr } from '../i18n'
import { nextQuestion, prefill, resolveRuta, type Answers } from '../lib/ruta'
import { rutaAnswers } from '../state/session'
import { openHelp } from '../state/ui'

/** Perfil con el que se rellena "¿Quién eres tú?": el usuario principal es personal de salud. */
const DEFAULT_ROLE = 'salud'

function salidaText(salida: Salida) {
  const locales = salida.locales as Partial<Record<'es' | 'qu', Salida['locales']['es']>>
  return locales[locale.value] ?? locales.es ?? Object.values(locales)[0]
}

function CallButtons({ ids, lines, urgent }: { ids: string[]; lines: HelpLine[]; urgent: boolean }) {
  return (
    <div class="actions">
      {ids.map((id) => {
        const line = lines.find((l) => l.id === id)
        if (!line) return null
        const text = line.locales[locale.value] ?? line.locales.es
        return (
          <a key={id} class={`btn ${urgent ? 'btn--alert' : 'btn--primary'}`} href={`tel:${line.number}`}>
            <Icon name="phone" />
            {t('route.call', { number: line.number })} · {text.label}
          </a>
        )
      })}
    </div>
  )
}

export function RouteScreen() {
  const ruta = getRuta()
  const lines = getHelpLines()
  const [changingRole, setChangingRole] = useState(false)

  if (!ruta) {
    return (
      <>
        <BackButton />
        <ScreenTitle>{t('route.title')}</ScreenTitle>
        <p class="callout callout--safety">{t('route.unavailable')}</p>
        <div class="actions">
          <button type="button" class="btn btn--alert" onClick={openHelp}>
            <Icon name="heart" />
            {t('action.help')}
          </button>
        </div>
      </>
    )
  }

  const texts = ruta.locales.es.preguntas
  const answers: Answers = { ...prefill(ruta, DEFAULT_ROLE), ...rutaAnswers.value }
  const result = resolveRuta(ruta, answers)
  const question = nextQuestion(ruta, answers)
  const done = result.terminated || question === null
  const roleQuestion = ruta.preguntas.find((q) => q.id === 'yo')
  const roleLabel = answers.yo ? (texts.yo?.opciones[answers.yo] ?? answers.yo) : ''
  const answeredCount = Object.keys(rutaAnswers.value).length

  const answer = (id: string, option: string) => {
    rutaAnswers.value = { ...rutaAnswers.value, [id]: option }
    setChangingRole(false)
  }
  const undo = () => {
    const order = ruta.preguntas.map((q) => q.id).filter((id) => rutaAnswers.value[id] !== undefined)
    const last = order[order.length - 1]
    if (!last) return
    const { [last]: _removed, ...rest } = rutaAnswers.value
    rutaAnswers.value = rest
  }
  const restart = () => {
    rutaAnswers.value = {}
    setChangingRole(false)
  }

  const salidas = new Map(ruta.salidas.map((s) => [s.id, s]))
  const blocks = result.ordered.map((id) => salidas.get(id)).filter((s): s is Salida => !!s)
  const showKnow = blocks.some((s) => s.incluyeLoQueDebesSaber)
  const know = ruta.loQueDebesSaber.locales.es

  return (
    <>
      <BackButton />
      <ScreenTitle>{t('route.title')}</ScreenTitle>
      <p class="lead">{t('route.intro')}</p>

      {roleQuestion && !changingRole && (
        <p class="muted">
          {t('route.you', { role: roleLabel })}{' '}
          <button type="button" class="link-button" onClick={() => setChangingRole(true)}>
            {t('route.change')}
          </button>
        </p>
      )}

      {(changingRole && roleQuestion) || (!done && question) ? (
        (() => {
          const q = changingRole && roleQuestion ? roleQuestion : question!
          const text = texts[q.id]
          return (
            <fieldset class="question">
              <legend>
                <span class="muted small">{t('route.step', { n: changingRole ? 5 : answeredCount + 1 })}</span>
                <span class="question-text">{text?.text ?? q.id}</span>
              </legend>
              {q.opciones.map((option) => (
                <button type="button" key={option} class="option" onClick={() => answer(q.id, option)}>
                  {text?.opciones[option] ?? option}
                </button>
              ))}
            </fieldset>
          )
        })()
      ) : null}

      {done && !changingRole && (
        <section aria-live="polite">
          <h2>{t('route.result')}</h2>
          {blocks.map((salida) => {
            const text = salidaText(salida)
            if (!text) return null
            const urgent = salida.id === 'emergencia'
            return (
              <section key={salida.id} class={`block result${urgent ? ' result--urgent' : ''}`}>
                <h3>{text.title}</h3>
                <ol>
                  {text.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <CallButtons ids={salida.calls} lines={lines} urgent={urgent} />
                {salida.serviceTypes.length > 0 && (
                  <p class="small">
                    <strong>{t('route.services')}:</strong>{' '}
                    {salida.serviceTypes.map((s) => tOr(`service.${s}`, s)).join(' · ')}
                  </p>
                )}
                {text.notes.map((note, i) => (
                  <p class="muted small" key={i}>
                    {note}
                  </p>
                ))}
              </section>
            )
          })}

          {showKnow && (
            <section class="block">
              <h3>{know.title}</h3>
              <ul>
                {know.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          <p class="muted small">{t('route.directory')}</p>
          <p class="callout callout--info">{t('route.disclaimer')}</p>
          {!ruta.review.es?.approved && <p class="callout callout--warning">{t('route.pendingLegal')}</p>}
        </section>
      )}

      <div class="actions">
        {answeredCount > 0 && (
          <button type="button" class="btn btn--quiet" onClick={undo}>
            <Icon name="back" />
            {t('route.undo')}
          </button>
        )}
        {answeredCount > 0 && (
          <button type="button" class="btn btn--quiet" onClick={restart}>
            {t('route.restart')}
          </button>
        )}
      </div>
    </>
  )
}
