import { ExploreTabs } from '../components/explore'
import { Eyebrow, ScreenTitle } from '../components/ui'
import { byOrder, piecesOf, reviewOf } from '../content'
import { locale, t } from '../i18n'

/** Frases para la consulta: español y propuesta en quechua. Lo que falta se marca; no se inventa. */
export function Phrases() {
  const groups = piecesOf('phrases').sort(byOrder)
  return (
    <>
      <Eyebrow>{t('explore.eyebrow')}</Eyebrow>
      <ScreenTitle>{t('phrases.title')}</ScreenTitle>
      <p class="lead">{t('phrases.intro')}</p>
      <ExploreTabs active="phrases" />
      <p class="callout callout--info">{t('phrases.note')}</p>

      {groups.map((group) => {
        const review = reviewOf(group, 'qu')
        return (
          <section class="panel" key={group.id}>
            <h2>{group.locales.es?.title}</h2>
            {!review.approved && <span class="badge badge--pending">{t('status.pending')}</span>}
            <ul class="phrases">
              {group.items.map((item) => (
                <li key={item.id}>
                  <p class="phrase-es">
                    <span class="visually-hidden">{t('phrases.es')}: </span>
                    {item.es}
                  </p>
                  {item.qu ? (
                    <p class="phrase-qu" lang="qu-PE">
                      <span class="visually-hidden">{t('phrases.qu')}: </span>
                      {item.qu}
                    </p>
                  ) : (
                    <p class="muted small">{t('phrases.pending')}</p>
                  )}
                  {item.qu && <p class="muted small">{item.pron ?? t('phrases.pron')}</p>}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {locale.value === 'qu' && groups.length === 0 && <p class="muted">{t('guides.empty')}</p>}
    </>
  )
}
