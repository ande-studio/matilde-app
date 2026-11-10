import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasTranslation, locale, t } from '../src/i18n'
import { exitApi, quickExit } from '../src/lib/exit'
import { PREFS_KEY, readJson } from '../src/lib/storage'
import {
  ageFilter,
  completed,
  eraseAll,
  markCompleted,
  saveProgress,
  setAgeFilter,
  setLocale,
  setSaveProgress,
} from '../src/state/prefs'
import { back, canGoBack, go, goRoot, resetRouter, route } from '../src/state/router'
import { rutaAnswers } from '../src/state/session'

beforeEach(() => {
  window.localStorage.clear()
  eraseAll()
})

describe('i18n', () => {
  it('traduce por clave y reemplaza parámetros', () => {
    expect(t('help.call', { number: '100' })).toBe('Llamar al 100')
  })

  it('cae al español cuando falta la traducción al quechua', () => {
    setLocale('qu')
    expect(t('action.help')).toBe('Yanapawanayta munani')
    expect(t('home.title')).toBe('¿En qué te ayudamos hoy?')
    expect(hasTranslation('action.help')).toBe(true)
    expect(hasTranslation('home.title')).toBe(false)
  })

  it('actualiza el idioma del documento', () => {
    setLocale('qu')
    expect(document.documentElement.lang).toBe('qu-PE')
    setLocale('es')
    expect(document.documentElement.lang).toBe('es')
  })
})

describe('preferencias y privacidad', () => {
  it('guarda idioma y edad, pero no el progreso si no se activó', () => {
    setLocale('qu')
    setAgeFilter('9-11')
    markCompleted('leccion-1')
    const stored = readJson<Record<string, unknown>>(PREFS_KEY)
    expect(stored).toMatchObject({ locale: 'qu', ageFilter: '9-11', saveProgress: false, completed: [] })
    expect(completed.value).toEqual(['leccion-1']) // en memoria durante la visita
  })

  it('persiste el progreso solo cuando la persona lo activa', () => {
    setSaveProgress(true)
    markCompleted('leccion-1')
    expect(readJson<{ completed: string[] }>(PREFS_KEY)?.completed).toEqual(['leccion-1'])
    setSaveProgress(false)
    expect(readJson<{ completed: string[] }>(PREFS_KEY)?.completed).toEqual([])
  })

  it('no guarda ningún otro dato en el dispositivo', () => {
    setLocale('qu')
    setAgeFilter('12-14')
    setSaveProgress(true)
    markCompleted('x')
    rutaAnswers.value = { peligro: 'no' }
    const keys = Object.keys(window.localStorage)
    expect(keys).toEqual([PREFS_KEY])
    expect(Object.keys(readJson<object>(PREFS_KEY)!).sort()).toEqual(['ageFilter', 'completed', 'locale', 'saveProgress'])
  })

  it('"Borrar todo" elimina lo guardado y restablece el estado', () => {
    window.localStorage.setItem('otra-app', 'no tocar')
    setLocale('qu')
    setAgeFilter('9-11')
    setSaveProgress(true)
    markCompleted('x')
    rutaAnswers.value = { peligro: 'no' }
    go({ name: 'settings' })

    eraseAll()

    expect(window.localStorage.getItem(PREFS_KEY)).toBeNull()
    expect(window.localStorage.getItem('otra-app')).toBe('no tocar')
    expect(locale.value).toBe('es')
    expect(ageFilter.value).toBe('all')
    expect(saveProgress.value).toBe(false)
    expect(completed.value).toEqual([])
    expect(rutaAnswers.value).toEqual({})
    expect(route.value).toEqual({ name: 'home' })
  })
})

describe('salir rápido', () => {
  it('descarta el estado en memoria y reemplaza la página por la pantalla neutra', () => {
    const replace = vi.spyOn(exitApi, 'replace').mockImplementation(() => {})
    rutaAnswers.value = { peligro: 'no', que: 'sexual' }
    go({ name: 'route' })

    quickExit()

    expect(replace).toHaveBeenCalledWith('/neutral.html')
    expect(rutaAnswers.value).toEqual({})
    expect(route.value).toEqual({ name: 'home' })
    expect(canGoBack()).toBe(false)
    replace.mockRestore()
  })
})

describe('enrutador en memoria', () => {
  it('apila, vuelve y reinicia sin tocar la URL', () => {
    const before = window.location.href
    go({ name: 'guides' })
    go({ name: 'guide', id: 'abordar-el-tema' })
    expect(route.value).toEqual({ name: 'guide', id: 'abordar-el-tema' })
    back()
    expect(route.value).toEqual({ name: 'guides' })
    goRoot({ name: 'settings' })
    expect(canGoBack()).toBe(false)
    resetRouter()
    expect(route.value).toEqual({ name: 'home' })
    expect(window.location.href).toBe(before)
  })
})
