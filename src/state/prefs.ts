import { signal } from '@preact/signals'
import type { AgeBand, Locale } from '../../schemas/content'
import { applyDocumentLanguage, locale } from '../i18n'
import { PREFS_KEY, readJson, removeAll, writeJson } from '../lib/storage'
import { dayKey, pruneActivity } from '../lib/week'
import { resetSession } from './session'
import { resetRouter } from './router'

export type AgeFilter = 'all' | AgeBand

interface StoredPrefs {
  locale?: Locale
  ageFilter?: AgeFilter
  saveProgress?: boolean
  completed?: string[]
  activity?: string[]
}

const stored = readJson<StoredPrefs>(PREFS_KEY)

export const ageFilter = signal<AgeFilter>(
  stored?.ageFilter === '9-11' || stored?.ageFilter === '12-14' ? stored.ageFilter : 'all',
)
export const saveProgress = signal<boolean>(stored?.saveProgress === true)
/** Ids de micro-lecciones completadas. Solo se persisten si `saveProgress` está activo. */
export const completed = signal<string[]>(stored?.saveProgress === true ? (stored.completed ?? []) : [])
/** Días ("AAAA-MM-DD") con alguna lección completada: alimenta la racha semanal. Misma regla de persistencia que `completed`. */
export const activity = signal<string[]>(
  stored?.saveProgress === true ? pruneActivity(stored.activity ?? [], new Date()) : [],
)

function persist(): void {
  writeJson(PREFS_KEY, {
    locale: locale.value,
    ageFilter: ageFilter.value,
    saveProgress: saveProgress.value,
    completed: saveProgress.value ? completed.value : [],
    activity: saveProgress.value ? pruneActivity(activity.value, new Date()) : [],
  } satisfies StoredPrefs)
}

export function setLocale(value: Locale): void {
  locale.value = value
  applyDocumentLanguage(value)
  persist()
}

export function setAgeFilter(value: AgeFilter): void {
  ageFilter.value = value
  persist()
}

export function setSaveProgress(value: boolean): void {
  saveProgress.value = value
  persist()
}

export function markCompleted(id: string): void {
  if (!completed.value.includes(id)) completed.value = [...completed.value, id]
  const today = dayKey(new Date())
  if (!activity.value.includes(today)) activity.value = [...activity.value, today]
  persist()
}

/** "Borrar todo de este dispositivo": preferencias, progreso y estado en memoria. */
export function eraseAll(): void {
  removeAll()
  ageFilter.value = 'all'
  saveProgress.value = false
  completed.value = []
  activity.value = []
  locale.value = 'es'
  applyDocumentLanguage('es')
  resetSession()
  resetRouter()
}
