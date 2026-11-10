import { useEffect, useRef, useState } from 'preact/hooks'
import type { Locale } from '../../schemas/content'
import { BackButton, Eyebrow, Icon, ScreenTitle } from '../components/ui'
import { byOrder, pieceById, piecesOf, reviewOf, textFor } from '../content'
import { locale, t, type MessageKey } from '../i18n'
import { matchesAge } from '../lib/age'
import { ageFilter, setAgeFilter, type AgeFilter } from '../state/prefs'
import { back, go } from '../state/router'

const AGES: AgeFilter[] = ['all', '9-11', '12-14']

export function Share() {
  const pieces = piecesOf('share')
    .filter((p) => matchesAge(p.ageBands, ageFilter.value))
    .sort(byOrder)

  return (
    <>
      <Eyebrow>{t('share.eyebrow')}</Eyebrow>
      <ScreenTitle>{t('share.title')}</ScreenTitle>
      <p class="lead">{t('share.intro')}</p>

      <div class="chips" role="group" aria-label={t('settings.age')}>
        {AGES.map((a) => (
          <button type="button" key={a} class="chip" aria-pressed={ageFilter.value === a} onClick={() => setAgeFilter(a)}>
            {t(`ageBand.${a}` as MessageKey)}
          </button>
        ))}
      </div>

      {pieces.length === 0 && <p class="muted">{t('share.empty')}</p>}
      <ul class="grid">
        {pieces.map((piece, i) => {
          const text = textFor(piece, locale.value)
          if (!text) return null
          return (
            <li key={piece.id}>
              <button type="button" class="topic-card" onClick={() => go({ name: 'share-view', id: piece.id })}>
                <span class="card-icon">
                  <Icon name={i % 2 === 0 ? 'sun' : 'heart'} />
                </span>
                <h3>{text.text.title}</h3>
                {text.text.summary && <p>{text.text.summary}</p>}
                <span class="card-meta">
                  {piece.ageBands.map((a) => (
                    <span class="badge" key={a}>
                      {t(`ageBand.${a}` as MessageKey)}
                    </span>
                  ))}
                </span>
                <span class="card-cta">
                  {t('share.start')}
                  <Icon name="arrow" />
                </span>
                <span class="visually-hidden">{t('share.view')}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p class="notice">{t('share.notice')}</p>
    </>
  )
}

const HOLD_MS = 800

/**
 * Vista compartida con la paciente: solo el mensaje pensado para ella, con letra grande.
 * No muestra navegación ni criterios del profesional; volver exige mantener presionado
 * (un gesto del profesional). "Salir rápido" y "Necesito ayuda" siguen visibles.
 */
export function ShareView({ id }: { id: string }) {
  const piece = pieceById('share', id)
  const available = (['es', 'qu'] as const).filter((l) => piece && textFor(piece, l)?.locale === l)
  const [viewLocale, setViewLocale] = useState<Locale>(available.includes(locale.value) ? locale.value : 'es')
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (!piece) {
    return (
      <>
        <BackButton />
        <p class="muted">{t('share.empty')}</p>
      </>
    )
  }
  const text = textFor(piece, viewLocale)
  if (!text) return null
  const review = reviewOf(piece, text.locale)

  const start = () => {
    if (timer.current !== undefined) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = undefined
      setHolding(false)
      back()
    }, HOLD_MS)
  }
  const cancel = () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    setHolding(false)
  }

  return (
    <article class="present" lang={text.locale === 'qu' ? 'qu-PE' : 'es'}>
      <h1 id="main-heading" tabIndex={-1} class="present-title">
        {text.text.title}
      </h1>
      {text.text.sections.map((s, i) => (
        <div key={i}>
          {s.paragraphs?.map((p, j) => (
            <p class="present-text" key={j}>
              {p}
            </p>
          ))}
        </div>
      ))}

      <footer class="present-footer">
        {available.length > 1 && (
          <div class="segmented" role="group" aria-label={t('share.view.language')}>
            {available.map((l) => (
              <button type="button" key={l} aria-pressed={viewLocale === l} onClick={() => setViewLocale(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {text.locale === 'qu' && <p class="muted small">{t('share.view.partial')}</p>}
        {!review.approved && <span class="badge badge--pending">{t('status.pending')}</span>}
        <button
          type="button"
          class="btn btn--quiet hold"
          aria-label={t('share.view.exit')}
          onPointerDown={start}
          onPointerUp={cancel}
          onPointerLeave={cancel}
          onPointerCancel={cancel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              start()
            }
          }}
          onKeyUp={cancel}
        >
          <Icon name="back" />
          {holding ? t('share.view.exiting') : t('share.view.exit')}
        </button>
      </footer>
    </article>
  )
}
