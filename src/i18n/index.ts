import { signal } from '@preact/signals'
import type { Locale } from '../../schemas/content'
import { PREFS_KEY, readJson } from '../lib/storage'
import { es, type MessageKey } from './es'
import { qu } from './qu'

export type { MessageKey }

function readInitialLocale(): Locale {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl === 'es' || fromUrl === 'qu') return fromUrl
  } catch {
    /* sin ubicación (pruebas) */
  }
  const saved = readJson<{ locale?: string }>(PREFS_KEY)?.locale
  return saved === 'qu' ? 'qu' : 'es'
}

export const locale = signal<Locale>(readInitialLocale())

export function applyDocumentLanguage(value: Locale): void {
  document.documentElement.lang = value === 'qu' ? 'qu-PE' : 'es'
}

/** Traduce una clave. Leer `locale.value` aquí hace que los componentes se actualicen al cambiar de idioma. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const message = (locale.value === 'qu' ? qu[key] : undefined) ?? es[key]
  return params ? message.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`)) : message
}

/** ¿Existe traducción propia para esta clave en el idioma actual? (si no, se usa español) */
export function hasTranslation(key: MessageKey): boolean {
  return locale.value === 'es' || qu[key] !== undefined
}
