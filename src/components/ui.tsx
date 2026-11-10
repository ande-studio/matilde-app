import type { ComponentChildren, JSX } from 'preact'
import type { Section } from '../../schemas/content'
import type { ReviewBadge } from '../content'
import { t, type MessageKey } from '../i18n'
import { back, canGoBack } from '../state/router'

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
  | 'back'
  | 'check'
  | 'shield'
  | 'chat'

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
  back: <path d="M15 6l-6 6 6 6" />,
  check: <path d="M5 12l5 5 9-10" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  chat: <path d="M4 5h16v10H9l-5 4z" />,
}

/** Los íconos siempre van acompañados de texto (SDD, calidad X.1): son decorativos para lectores de pantalla. */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
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
