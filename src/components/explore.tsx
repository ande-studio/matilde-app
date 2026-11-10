import type { PieceOf } from '../content'
import { locale, t, type MessageKey } from '../i18n'
import { completed } from '../state/prefs'
import { go, goRoot, route, type Route } from '../state/router'
import { textFor } from '../content'
import { Icon, lessonIcon } from './ui'

type Tab = 'guides' | 'training' | 'phrases'

const TABS: { tab: Tab; label: MessageKey; to: Route }[] = [
  { tab: 'guides', label: 'explore.tab.guides', to: { name: 'guides' } },
  { tab: 'training', label: 'explore.tab.training', to: { name: 'training' } },
  { tab: 'phrases', label: 'explore.tab.phrases', to: { name: 'phrases' } },
]

/** Pestañas de "Explorar lecciones": agrupan las guías, la formación y las frases bajo una misma sección. */
export function ExploreTabs({ active }: { active: Tab }) {
  return (
    <div class="tabs" role="group" aria-label={t('explore.tabs')}>
      {TABS.map((item) => (
        <button
          type="button"
          key={item.tab}
          class="tab"
          aria-current={active === item.tab ? 'page' : undefined}
          onClick={() => active !== item.tab && goRoot(item.to)}
        >
          {t(item.label)}
        </button>
      ))}
    </div>
  )
}

/** Mantiene la sección activa aunque la pantalla de fondo sea de otra pestaña. */
export function currentTab(): Tab {
  const name = route.value.name
  return name === 'training' || name === 'lesson' ? 'training' : name === 'phrases' ? 'phrases' : 'guides'
}

type Lesson = PieceOf<'lesson'>

/** Unidad con la ruta de micro-lecciones (inicio y Formación). */
export function LessonPath({ lessons }: { lessons: Lesson[] }) {
  const nextIndex = lessons.findIndex((l) => !completed.value.includes(l.id))
  return (
    <div class="unit">
      <div class="unit-top">
        <div>
          <small>{t('home.unit.label')}</small>
          <b>{t('home.unit.title')}</b>
        </div>
        <span class="unit-flag">
          <Icon name="flag" />
        </span>
      </div>
      {lessons.map((lesson, i) => {
        const text = textFor(lesson, locale.value)
        if (!text) return null
        const isDone = completed.value.includes(lesson.id)
        const isNext = i === nextIndex
        return (
          <button
            type="button"
            key={lesson.id}
            class={`lesson-row${isDone ? ' is-done' : isNext ? ' is-current' : ''}`}
            onClick={() => go({ name: 'lesson', id: lesson.id })}
          >
            <span class="lesson-icon">
              <Icon name={isDone ? 'check' : lessonIcon(i)} />
            </span>
            <span class="lesson-main">
              <span class="lesson-title">
                {text.text.title}
                {isNext && <span class="tag">{t('home.start.here')}</span>}
              </span>
              <span class="lesson-meta">
                {text.text.summary && <span>{`${i + 1}. ${text.text.summary}`}</span>}
                <span>
                  <Icon name="clock" />
                  {t('lesson.minutes', { n: lesson.durationMin })}
                </span>
                {isDone && <span>{t('lesson.completed')}</span>}
              </span>
            </span>
            <span class="lesson-arrow">
              <Icon name={isDone ? 'check' : 'chevron'} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
