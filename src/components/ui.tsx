import type { ComponentChildren, JSX } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import type { Section } from '../../schemas/content'
import type { ReviewBadge } from '../content'
import { t, type MessageKey } from '../i18n'
import { quickExit } from '../lib/exit'
import { back, canGoBack } from '../state/router'
import { openHelp } from '../state/ui'

export type IconName =
  | 'home'
  | 'book'
  | 'present'
  | 'cap'
  | 'sliders'
  | 'phone'
  | 'heart'
  | 'exit'
  | 'chevron'
  | 'chevron-down'
  | 'back'
  | 'check'
  | 'shield'
  | 'chat'
  | 'sun'
  | 'spark'
  | 'flower'
  | 'clock'
  | 'flag'
  | 'arrow'
  | 'external'
  | 'user'
  | 'globe'
  | 'close'
  | 'leaf'
  | 'quote'

const ICONS: Record<IconName, JSX.Element> = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13" />,
  present: <path d="M3 4h18v12H3zM8 20h8M12 16v4" />,
  cap: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  sliders: <path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2M14 4v4M8 10v4M16 16v4" />,
  phone: (
    <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />
  ),
  heart: <path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />,
  exit: <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  check: <path d="M5 12l5 5 9-10" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  chat: <path d="M4 5h16v10H9l-5 4z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  flower: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="12" cy="5.8" r="2.6" />
      <circle cx="17.9" cy="10.1" r="2.6" />
      <circle cx="15.6" cy="17" r="2.6" />
      <circle cx="8.4" cy="17" r="2.6" />
      <circle cx="6.1" cy="10.1" r="2.6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  external: <path d="M7 17L17 7M8 7h9v9" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14zM5 19l8-8" />,
  quote: <path d="M9 7H5v6h4v4H5M19 7h-4v6h4v4h-4" />,
}

/** Los íconos siempre van acompañados de texto (SDD, calidad X.1): son decorativos para lectores de pantalla. */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  )
}

/** Íconos de lección: se reparten en orden para dar variedad sin depender de glifos Unicode (pueden faltar en Android de gama baja). */
const LESSON_ICONS: IconName[] = ['flower', 'sun', 'spark', 'leaf', 'heart', 'quote']
export function lessonIcon(index: number): IconName {
  return LESSON_ICONS[index % LESSON_ICONS.length] ?? 'flower'
}

/** La flor de Matilde. Es decorativa: el texto siempre acompaña. */
export function Mascot({ class: cls = '' }: { class?: string }) {
  return <img class={`mascot ${cls}`.trim()} src="/matilde-flor.svg" alt="" aria-hidden="true" />
}

export function Wordmark() {
  return (
    <>
      <Mascot class="wordmark-flower" />
      <span class="wordmark-text">
        matilde<span class="brand-dot">.</span>
      </span>
    </>
  )
}

/** Título de pantalla: recibe el foco al navegar para anunciar el cambio a lectores de pantalla. */
export function ScreenTitle({ children }: { children: ComponentChildren }) {
  return (
    <h1 id="main-heading" class="screen-title" tabIndex={-1}>
      {children}
    </h1>
  )
}

export function Eyebrow({ children }: { children: ComponentChildren }) {
  return <p class="eyebrow">{children}</p>
}

export function BackButton() {
  if (!canGoBack()) return null
  return (
    <button type="button" class="link-button back" onClick={back}>
      <Icon name="back" />
      {t('action.back')}
    </button>
  )
}

export function StatusBadge({ review }: { review: ReviewBadge }) {
  if (review.approved) return <span class="badge badge--ok">{t('status.approved')}</span>
  return <span class="badge badge--pending">{t('status.pending')}</span>
}

export function MissingReviews({ review }: { review: ReviewBadge }) {
  if (review.approved || review.missing.length === 0) return null
  const types = review.missing.map((m) => t(`review.${m}` as MessageKey)).join(', ')
  return <p class="muted small">{t('status.missing', { types })}</p>
}

export function Sections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <section class="block" key={i}>
          {s.heading && <h2>{s.heading}</h2>}
          {s.paragraphs?.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
          {s.bullets && (
            <ul>
              {s.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          )}
          {s.steps && (
            <ol>
              {s.steps.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ol>
          )}
          {s.callout && <p class={`callout callout--${s.callout.tone}`}>{s.callout.text}</p>}
        </section>
      ))}
    </>
  )
}

/** Enlaces externos: solo se abren por acción de la persona, sin enviar referencia. */
export function ExternalLink({ href, children }: { href: string; children: ComponentChildren }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

const FOCUSABLE = 'a[href], button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  /** Id del título (lo referencia `aria-labelledby`). */
  titleId: string
  onClose: () => void
  children: ComponentChildren
  /** `alertdialog` para confirmaciones. */
  role?: 'dialog' | 'alertdialog'
  /** Muestra el atajo "Necesito ayuda" en la barra superior (no en la propia ayuda). */
  showHelp?: boolean
}

/**
 * Diálogo modal. La barra superior mantiene "Salir rápido" (y "Necesito ayuda") a la vista, como en el resto de la app.
 * Esc cierra el diálogo y NO cuenta para la salida rápida de dos pulsaciones (se detiene antes de llegar a `window`).
 */
export function Modal({ titleId, onClose, children, role = 'dialog', showHelp = true }: ModalProps) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const heading = root.current?.querySelector<HTMLElement>(`#${titleId}`)
    ;(heading ?? root.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus({ preventScroll: true })
    return () => previous?.focus?.({ preventScroll: true })
  }, [titleId])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !root.current) return
    const items = Array.from(root.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]!
    const last = items[items.length - 1]!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div class="overlay" onKeyDown={onKeyDown} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="modal" role={role} aria-modal="true" aria-labelledby={titleId} ref={root}>
        <div class="modal-inner">
          <div class="modal-top">
            {showHelp ? (
              <button
                type="button"
                class="modal-help"
                onClick={() => {
                  onClose()
                  openHelp()
                }}
              >
                {t('action.help')}
              </button>
            ) : (
              <span />
            )}
            <button type="button" class="exit-btn" onClick={quickExit}>
              {t('action.exit')}
              <Icon name="external" />
            </button>
            <button type="button" class="close" aria-label={t('action.close')} onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
