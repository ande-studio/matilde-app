import { useState } from 'preact/hooks'
import { BackButton, Icon, MissingReviews, ScreenTitle, Sections, StatusBadge } from '../components/ui'
import { byOrder, pieceById, piecesOf, reviewOf, textFor } from '../content'
import { locale, t } from '../i18n'
import { completed, markCompleted, saveProgress } from '../state/prefs'
import { back, go } from '../state/router'

export function Training() {
  const lessons = piecesOf('lesson').sort(byOrder)
  const done = lessons.filter((l) => completed.value.includes(l.id)).length

  return (
    <>
      <ScreenTitle>{t('training.title')}</ScreenTitle>
      <p class="lead">{t('training.intro')}</p>
      <p class="muted small">
        {t('training.progress', { done, total: lessons.length })}
        {!saveProgress.value && ` · ${t('training.saveHint')}`}
      </p>

      {lessons.length === 0 && <p class="muted">{t('training.empty')}</p>}
      <ul class="cards">
        {lessons.map((lesson) => {
          const text = textFor(lesson, locale.value)
          if (!text) return null
          const isDone = completed.value.includes(lesson.id)
          return (
            <li key={lesson.id}>
              <button type="button" class="card" onClick={() => go({ name: 'lesson', id: lesson.id })}>
                <span class="card-body">
                  <strong>{text.text.title}</strong>
                  {text.text.summary && <span class="muted">{text.text.summary}</span>}
                  <span class="card-meta">
                    <span class="badge">{t('lesson.minutes', { n: lesson.durationMin })}</span>
                    {isDone && <span class="badge badge--ok">{t('lesson.completed')}</span>}
                    <StatusBadge review={reviewOf(lesson, locale.value)} />
                  </span>
                </span>
                <Icon name={isDone ? 'check' : 'chevron'} />
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function Lesson({ id }: { id: string }) {
  const lesson = pieceById('lesson', id)
  const text = lesson && textFor(lesson, locale.value)
  const [practicing, setPracticing] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  if (!lesson || !text) {
    return (
      <>
        <BackButton />
        <p class="muted">{t('training.empty')}</p>
      </>
    )
  }
  const review = reviewOf(lesson, text.locale)
  const activity = text.text.activity
  const choice = activity?.options.find((o) => o.id === selected)
  const isDone = completed.value.includes(lesson.id)

  const finish = () => {
    markCompleted(lesson.id)
    back()
  }

  return (
    <>
      <BackButton />
      <ScreenTitle>{text.text.title}</ScreenTitle>
      <p class="card-meta">
        <span class="badge">{t('lesson.minutes', { n: lesson.durationMin })}</span>
        <StatusBadge review={review} />
      </p>
      <MissingReviews review={review} />
      <Sections sections={text.text.sections} />

      {activity && !practicing && (
        <div class="actions">
          <button type="button" class="btn btn--primary" onClick={() => setPracticing(true)}>
            {t('lesson.practice')}
          </button>
        </div>
      )}

      {activity && practicing && (
        <fieldset class="question">
          <legend>
            <span class="question-text">{activity.prompt}</span>
          </legend>
          {activity.options.map((option) => (
            <button
              type="button"
              key={option.id}
              class={`option${selected === option.id ? (option.correct ? ' option--right' : ' option--wrong') : ''}`}
              aria-pressed={selected === option.id}
              onClick={() => setSelected(option.id)}
            >
              {option.text}
            </button>
          ))}
          {choice && (
            <p class={`callout ${choice.correct ? 'callout--info' : 'callout--warning'}`} role="status">
              {choice.feedback}
            </p>
          )}
          <div class="actions">
            {choice && !choice.correct && (
              <button type="button" class="btn btn--quiet" onClick={() => setSelected(null)}>
                {t('lesson.retry')}
              </button>
            )}
            {choice?.correct && (
              <button type="button" class="btn btn--primary" onClick={finish}>
                <Icon name="check" />
                {t('lesson.complete')}
              </button>
            )}
          </div>
        </fieldset>
      )}

      {!activity && (
        <div class="actions">
          <button type="button" class="btn btn--primary" onClick={finish} disabled={isDone}>
            <Icon name="check" />
            {isDone ? t('lesson.completed') : t('lesson.complete')}
          </button>
        </div>
      )}
    </>
  )
}
