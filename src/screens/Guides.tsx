import { useState } from 'preact/hooks'
import type { Category } from '../../schemas/content'
import { Icon, MissingReviews, ScreenTitle, Sections, StatusBadge, BackButton, ExternalLink } from '../components/ui'
import { byOrder, pieceById, piecesOf, reviewOf, textFor } from '../content'
import { locale, t, tOr, type MessageKey } from '../i18n'
import { matchesAge } from '../lib/age'
import { ageFilter } from '../state/prefs'
import { go } from '../state/router'

const CATEGORIES: Category[] = ['abordar', 'menstruacion', 'evaluar', 'cuidados', 'mitos', 'proteccion']

export function Guides({ category }: { category?: Category }) {
  const [active, setActive] = useState<Category | 'all'>(category ?? 'all')
  const guides = piecesOf('guide')
    .filter((g) => matchesAge(g.ageBands, ageFilter.value))
    .sort(byOrder)
  const available = CATEGORIES.filter((c) => guides.some((g) => g.category === c))
  const shown = active === 'all' ? guides : guides.filter((g) => g.category === active)

  return (
    <>
      <ScreenTitle>{t('guides.title')}</ScreenTitle>
      <p class="lead">{t('guides.intro')}</p>

      <div class="chips" role="group" aria-label={t('guides.title')}>
        <button type="button" class="chip" aria-pressed={active === 'all'} onClick={() => setActive('all')}>
          {t('guides.filter.all')}
        </button>
        {available.map((c) => (
          <button type="button" key={c} class="chip" aria-pressed={active === c} onClick={() => setActive(c)}>
            {t(`category.${c}` as MessageKey)}
          </button>
        ))}
      </div>

      {shown.length === 0 && <p class="muted">{t('guides.empty')}</p>}
      <ul class="cards">
        {shown.map((guide) => {
          const text = textFor(guide, locale.value)
          if (!text) return null
          return (
            <li key={guide.id}>
              <button type="button" class="card" onClick={() => go({ name: 'guide', id: guide.id })}>
                <span class="card-body">
                  <strong>{text.text.title}</strong>
                  {text.text.summary && <span class="muted">{text.text.summary}</span>}
                  <span class="card-meta">
                    <span class="badge">{t(`category.${guide.category}` as MessageKey)}</span>
                    <StatusBadge review={reviewOf(guide, locale.value)} />
                  </span>
                </span>
                <Icon name="chevron" />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function GuideDetail({ id }: { id: string }) {
  const guide = pieceById('guide', id)
  const text = guide && textFor(guide, locale.value)
  if (!guide || !text) {
    return (
      <>
        <BackButton />
        <ScreenTitle>{t('guides.title')}</ScreenTitle>
        <p class="muted">{t('guides.empty')}</p>
      </>
    )
  }
  const review = reviewOf(guide, text.locale)
  const hasShare = piecesOf('share').length > 0

  return (
    <>
      <BackButton />
      <ScreenTitle>{text.text.title}</ScreenTitle>
      {text.text.summary && <p class="lead">{text.text.summary}</p>}
      <p class="card-meta">
        <StatusBadge review={review} />
      </p>
      <MissingReviews review={review} />
      {text.fallback && <p class="callout callout--info">{t('guide.fallback')}</p>}

      <Sections sections={text.text.sections} />

      <div class="actions">
        {hasShare && (
          <button type="button" class="btn btn--primary" onClick={() => go({ name: 'share' })}>
            <Icon name="present" />
            {t('guide.showToPatient')}
          </button>
        )}
      </div>

      <section class="block suspect">
        <h2>{t('guide.suspect')}</h2>
        <button type="button" class="btn btn--alert" onClick={() => go({ name: 'route' })}>
          <Icon name="shield" />
          {t('guide.suspect.cta')}
        </button>
      </section>

      <section class="block small">
        <p class="muted">
          <strong>{t('guide.rights')}:</strong>{' '}
          {guide.rights.map((r) => tOr(`right.${r}`, r)).join(', ')}
        </p>
        {guide.sources.length > 0 && (
          <>
            <h2>{t('guide.sources')}</h2>
            <ul>
              {guide.sources.map((s) => (
                <li key={s.label}>{s.url ? <ExternalLink href={s.url}>{s.label}</ExternalLink> : s.label}</li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  )
}
