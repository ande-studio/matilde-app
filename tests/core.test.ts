import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasTranslation, locale, t } from '../src/i18n'
import { exitApi, quickExit } from '../src/lib/exit'
import { dayKey, KEEP_DAYS, pruneActivity, weekDays } from '../src/lib/week'
import { PREFS_KEY, readJson } from '../src/lib/storage'
import {
  activity,
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
    expect(t('home.title')).toBe('¡Qué bueno verte por aquí!')
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
    expect(Object.keys(readJson<object>(PREFS_KEY)!).sort()).toEqual(['activity', 'ageFilter', 'completed', 'locale', 'saveProgress'])
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
    expect(activity.value).toEqual([])
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

describe('racha semanal (opcional y local)', () => {
  const wednesday = new Date(2026, 10, 11) // miércoles 11 de noviembre de 2026

  it('muestra la semana de lunes a domingo y marca hoy y los días con lección', () => {
    const week = weekDays(wednesday, ['2026-11-09', '2026-11-11', '2026-10-01'])
    expect(week.map((d) => d.key)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ])
    expect(week.map((d) => d.letter).join('')).toBe('LMMJVSD')
    expect(week.filter((d) => d.done).map((d) => d.key)).toEqual(['2026-11-09', '2026-11-11'])
    expect(week.filter((d) => d.today).map((d) => d.key)).toEqual(['2026-11-11'])
  })

  it('el domingo cuenta como último día de la semana', () => {
    const sunday = new Date(2026, 10, 15)
    const week = weekDays(sunday, [])
    expect(week[0]?.key).toBe('2026-11-09')
    expect(week[6]?.today).toBe(true)
  })

  it('conserva solo los últimos días y descarta valores no válidos', () => {
    const today = new Date(2026, 10, 11)
    const old = dayKey(new Date(2026, 10, 11 - KEEP_DAYS - 1))
    expect(pruneActivity([old, '2026-11-10', '2026-11-10', 'no-es-fecha', '2026-11-09'], today)).toEqual([
      '2026-11-09',
      '2026-11-10',
    ])
  })

  it('completar una lección registra el día, pero solo se guarda si la persona activó guardar el progreso', () => {
    markCompleted('leccion-1')
    const today = dayKey(new Date())
    expect(activity.value).toEqual([today])
    expect(readJson<{ activity: string[] }>(PREFS_KEY)?.activity).toEqual([])

    setSaveProgress(true)
    expect(readJson<{ activity: string[] }>(PREFS_KEY)?.activity).toEqual([today])
    setSaveProgress(false)
    expect(readJson<{ activity: string[] }>(PREFS_KEY)?.activity).toEqual([])
  })
})
