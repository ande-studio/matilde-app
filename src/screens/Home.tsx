import { LessonPath } from '../components/explore'
import { Icon, Mascot, ScreenTitle, Eyebrow, type IconName } from '../components/ui'
import { byOrder, piecesOf } from '../content'
import { t, type MessageKey } from '../i18n'
import { weekDays } from '../lib/week'
import { activity, completed, saveProgress } from '../state/prefs'
import { go, goRoot, type Route } from '../state/router'

interface Quick {
  icon: IconName
  title: MessageKey
  desc: MessageKey
  to: Route
  alert?: boolean
}

const QUICK: Quick[] = [
  { icon: 'shield', title: 'home.route.title', desc: 'home.route.desc', to: { name: 'route' }, alert: true },
  { icon: 'book', title: 'home.guides.title', desc: 'home.guides.desc', to: { name: 'guides' } },
  { icon: 'chat', title: 'home.phrases.title', desc: 'home.phrases.desc', to: { name: 'phrases' } },
]

function ProgressCard({ total }: { total: number }) {
  const done = piecesOf('lesson').filter((l) => completed.value.includes(l.id)).length
  const week = weekDays(new Date(), activity.value)
  const message = done === 0 ? 'progress.empty' : done >= total && total > 0 ? 'progress.done' : 'progress.some'

  return (
    <section class="rail-card" aria-labelledby="progress-title">
      <div class="progress-title">
        <h3 id="progress-title">{t('progress.title')}</h3>
        <Icon name="spark" />
      </div>
      <div class="progress-number">
        {done} <small>{t('progress.of', { total })}</small>
      </div>
      <div
        class="progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={t('progress.title')}
      >
        <i style={{ width: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%' }} />
      </div>
      <p>{t(message)}</p>
      <ul class="week" aria-label={t('progress.week')}>
        {week.map((day) => (
          <li key={day.key} class={`${day.done ? 'is-done' : ''} ${day.today ? 'is-today' : ''}`.trim()}>
            <i>{day.done ? <Icon name="check" /> : day.today ? <Icon name="flower" /> : null}</i>
            <span aria-hidden="true">{day.letter}</span>
            <span class="visually-hidden">
              {day.name}
              {day.done ? `: ${t('lesson.completed')}` : ''}
            </span>
          </li>
        ))}
      </ul>
      <p class="progress-where">{t(saveProgress.value ? 'progress.saved' : 'progress.session')}</p>
    </section>
  )
}

export function Home() {
  const lessons = piecesOf('lesson').sort(byOrder)
  const done = lessons.filter((l) => completed.value.includes(l.id)).length
  const next = lessons.find((l) => !completed.value.includes(l.id)) ?? lessons[0]

  const startPath = () => (next ? go({ name: 'lesson', id: next.id }) : goRoot({ name: 'guides' }))

  return (
    <>
      <div class="greeting">
        <div>
          <Eyebrow>{t('home.eyebrow')}</Eyebrow>
          <ScreenTitle>{t('home.title')}</ScreenTitle>
          <p>{t('home.subtitle')}</p>
        </div>
        <button type="button" class="profile-pill" onClick={() => goRoot({ name: 'settings' })}>
          <span class="profile-icon">
            <Icon name="user" />
          </span>
          {t('profile.role')}
          <Icon name="chevron-down" />
        </button>
      </div>

      <div class="columns">
        <section aria-label={t('home.hero.label')}>
          <div class="hero">
            <div class="hero-label">{t('home.hero.label')}</div>
            <h2>{t('home.hero.title')}</h2>
            <p>{t('home.hero.body')}</p>
            <button type="button" class="btn btn--primary" onClick={startPath}>
              {t(done > 0 ? 'home.hero.continue' : 'home.hero.start')}
              <Icon name="arrow" />
            </button>
            <Mascot />
            <span class="spark s1" aria-hidden="true">
              <Icon name="spark" />
            </span>
            <span class="spark s2" aria-hidden="true">
              <Icon name="spark" />
            </span>
            <span class="spark s3" aria-hidden="true">
              <Icon name="spark" />
            </span>
          </div>

          <div class="quick" role="group" aria-label={t('home.quick.title')}>
            {QUICK.map((item) => (
              <button
                type="button"
                key={item.title}
                class={`quick-card${item.alert ? ' quick-card--alert' : ''}`}
                onClick={() => go(item.to)}
              >
                <Icon name={item.icon} />
                <span>
                  <strong>{t(item.title)}</strong>
                  <span>{t(item.desc)}</span>
                </span>
              </button>
            ))}
          </div>

          {lessons.length > 0 && (
            <>
              <div class="path-head">
                <h2>{t('home.path.title')}</h2>
                <span>{t('home.path.meta', { n: lessons.length })}</span>
              </div>
              <LessonPath lessons={lessons} />
            </>
          )}
          <p class="bottom-note">
            <Icon name="leaf" />
            {t('home.note')}
          </p>
        </section>

        <aside class="rail" aria-label={t('progress.title')}>
          <ProgressCard total={lessons.length} />

          <section class="rail-card ask-card">
            <div class="ask-top">
              <Mascot />
              <h3>{t('ask.title')}</h3>
            </div>
            <span class="soon-tag">{t('soon.tag')}</span>
            <p>{t('ask.body')}</p>
            <button type="button" class="btn btn--outline btn--block" onClick={() => goRoot({ name: 'matilde' })}>
              {t('ask.cta')}
              <Icon name="arrow" />
            </button>
          </section>

          <section class="rail-card tip-card">
            <Icon name="heart" />
            <h3>{t('tip.title')}</h3>
            <p>{t('tip.body')}</p>
            <button type="button" class="link-button" onClick={() => goRoot({ name: 'share' })}>
              {t('tip.cta')}
              <Icon name="arrow" />
            </button>
          </section>
        </aside>
      </div>

      <p class="muted small">{t('home.privacy')}</p>
    </>
  )
}
