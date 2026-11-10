import { signal } from '@preact/signals'
import { Icon, ScreenTitle } from '../components/ui'
import { goRoot } from '../state/router'
import { contentMeta } from '../content'
import { locale, t, type MessageKey } from '../i18n'
import { quickExit } from '../lib/exit'
import {
  ageFilter,
  eraseAll,
  saveProgress,
  setAgeFilter,
  setLocale,
  setSaveProgress,
  type AgeFilter,
} from '../state/prefs'

const AGES: AgeFilter[] = ['all', '9-11', '12-14']
const confirming = signal(false)
const erased = signal(false)

export function Settings() {
  const onErase = () => {
    eraseAll()
    goRoot({ name: 'settings' }) // se queda en Ajustes para ver la confirmación
    confirming.value = false
    erased.value = true
  }

  return (
    <>
      <ScreenTitle>{t('settings.title')}</ScreenTitle>

      <section class="block">
        <h2>{t('settings.language')}</h2>
        <div class="segmented" role="group" aria-label={t('settings.language')}>
          {(['es', 'qu'] as const).map((l) => (
            <button type="button" key={l} aria-pressed={locale.value === l} onClick={() => setLocale(l)}>
              {t(l === 'es' ? 'language.es' : 'language.qu')}
            </button>
          ))}
        </div>
      </section>

      <section class="block">
        <h2>
          <label for="age">{t('settings.age')}</label>
        </h2>
        <select id="age" value={ageFilter.value} onChange={(e) => setAgeFilter(e.currentTarget.value as AgeFilter)}>
          {AGES.map((a) => (
            <option key={a} value={a}>
              {t(`ageBand.${a}` as MessageKey)}
            </option>
          ))}
        </select>
        <p class="muted small">{t('settings.age.hint')}</p>
      </section>

      <section class="block">
        <h2>{t('settings.privacy.title')}</h2>
        <label class="switch">
          <input
            type="checkbox"
            checked={saveProgress.value}
            onChange={(e) => setSaveProgress(e.currentTarget.checked)}
          />
          <span>{t('settings.progress')}</span>
        </label>
        <p class="muted small">{t('settings.progress.hint')}</p>
        <p>{t('settings.privacy.body')}</p>

        {!confirming.value ? (
          <button
            type="button"
            class="btn btn--alert-quiet"
            onClick={() => {
              erased.value = false
              confirming.value = true
            }}
          >
            {t('settings.erase')}
          </button>
        ) : (
          <div class="confirm" role="alertdialog" aria-labelledby="erase-title" aria-describedby="erase-body">
            <h3 id="erase-title">{t('settings.erase.title')}</h3>
            <p id="erase-body">{t('settings.erase.body')}</p>
            <div class="actions">
              <button type="button" class="btn btn--quiet" onClick={() => (confirming.value = false)}>
                {t('settings.erase.cancel')}
              </button>
              <button type="button" class="btn btn--alert" onClick={onErase}>
                {t('settings.erase.confirm')}
              </button>
            </div>
          </div>
        )}
        {erased.value && (
          <p class="callout callout--info" role="status">
            {t('settings.erase.done')}
          </p>
        )}
      </section>

      <section class="block">
        <h2>{t('settings.exit.title')}</h2>
        <p>{t('settings.exit.body')}</p>
        <button type="button" class="btn btn--quiet" onClick={quickExit}>
          <Icon name="exit" />
          {t('action.exit')}
        </button>
      </section>

      <section class="block small">
        <h2>{t('settings.about.title')}</h2>
        <p>{t('settings.about.stage')}</p>
        <p class="muted">
          {t('settings.about.version', { version: contentMeta.version, channel: contentMeta.channel })}
        </p>
      </section>
    </>
  )
}
