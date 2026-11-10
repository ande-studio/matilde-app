import { signal } from '@preact/signals'
import { Eyebrow, Icon, Modal, ScreenTitle } from '../components/ui'
import { contentMeta } from '../content'
import { locale, t, type MessageKey } from '../i18n'
import { quickExit } from '../lib/exit'
import {
  ageFilter,
  eraseAll,
  saveProgress,
  setAgeFilter,
  setSaveProgress,
  type AgeFilter,
} from '../state/prefs'
import { goRoot } from '../state/router'
import { languageOpen } from '../state/ui'

const AGES: AgeFilter[] = ['all', '9-11', '12-14']
const confirming = signal(false)
const erased = signal(false)

function EraseDialog() {
  const close = () => (confirming.value = false)
  const confirm = () => {
    eraseAll()
    goRoot({ name: 'settings' }) // se queda en Ajustes para ver la confirmación
    confirming.value = false
    erased.value = true
  }
  return (
    <Modal titleId="erase-title" role="alertdialog" onClose={close}>
      <h2 id="erase-title" tabIndex={-1}>
        {t('settings.erase.title')}
      </h2>
      <p>{t('settings.erase.body')}</p>
      <div class="modal-actions">
        <button type="button" class="btn btn--quiet" onClick={close}>
          {t('settings.erase.cancel')}
        </button>
        <button type="button" class="btn btn--alert" onClick={confirm}>
          {t('settings.erase.confirm')}
        </button>
      </div>
    </Modal>
  )
}

export function Settings() {
  return (
    <div class="settings">
      <Eyebrow>{t('settings.eyebrow')}</Eyebrow>
      <ScreenTitle>{t('settings.title')}</ScreenTitle>
      <p class="lead">{t('settings.intro')}</p>

      <section class="setting-panel">
        <h2>{t('settings.role.title')}</h2>
        <p>{t('settings.role.body')}</p>
        <label class="field" for="age">
          {t('settings.age')}
        </label>
        <select id="age" value={ageFilter.value} onChange={(e) => setAgeFilter(e.currentTarget.value as AgeFilter)}>
          {AGES.map((a) => (
            <option key={a} value={a}>
              {t(`ageBand.${a}` as MessageKey)}
            </option>
          ))}
        </select>
        <p class="muted small">{t('settings.age.hint')}</p>
      </section>

      <section class="setting-panel">
        <h2>{t('settings.language')}</h2>
        <p>{t('settings.language.body')}</p>
        <p class="muted small">{t(locale.value === 'es' ? 'language.es.long' : 'language.qu.long')}</p>
        <button type="button" class="btn btn--outline" onClick={() => (languageOpen.value = true)}>
          <Icon name="globe" />
          {t('settings.language.change')}
        </button>
      </section>

      <section class="setting-panel">
        <h2>{t('settings.privacy.title')}</h2>
        <label class="switch">
          <span>{t('settings.progress')}</span>
          <input
            type="checkbox"
            checked={saveProgress.value}
            onChange={(e) => setSaveProgress(e.currentTarget.checked)}
          />
        </label>
        <p class="muted small">{t('settings.progress.hint')}</p>
        <p>{t('settings.privacy.body')}</p>

        <button
          type="button"
          class="danger-btn"
          onClick={() => {
            erased.value = false
            confirming.value = true
          }}
        >
          {t('settings.erase')}
        </button>
        {erased.value && (
          <p class="callout callout--info" role="status">
            {t('settings.erase.done')}
          </p>
        )}
      </section>

      <section class="setting-panel">
        <h2>{t('settings.exit.title')}</h2>
        <p>{t('settings.exit.body')}</p>
        <button type="button" class="btn btn--quiet" onClick={quickExit}>
          <Icon name="exit" />
          {t('action.exit')}
        </button>
      </section>

      <section class="setting-panel">
        <h2>{t('settings.about.title')}</h2>
        <p>{t('settings.about.stage')}</p>
        <p class="muted small">
          {t('settings.about.version', { version: contentMeta.version, channel: contentMeta.channel })}
        </p>
      </section>

      {confirming.value && <EraseDialog />}
    </div>
  )
}
