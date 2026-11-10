/**
 * Racha semanal (gamificación opcional y local). Solo guarda días ("AAAA-MM-DD") en los que se completó una lección,
 * únicamente si la persona activa "guardar mi progreso". Sin hora ni detalle de qué lección.
 */

/** Cuántos días se conservan (minimización: la vista solo usa la semana en curso). */
export const KEEP_DAYS = 14

export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, n: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
  return next
}

/** Los 7 días de la semana en curso, de lunes a domingo. */
export interface WeekDay {
  key: string
  letter: string
  name: string
  done: boolean
  today: boolean
}

const LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

export function weekDays(today: Date, activity: readonly string[]): WeekDay[] {
  const offset = (today.getDay() + 6) % 7 // lunes = 0
  const monday = addDays(today, -offset)
  const todayKey = dayKey(today)
  return LETTERS.map((letter, i) => {
    const key = dayKey(addDays(monday, i))
    return { key, letter, name: NAMES[i]!, done: activity.includes(key), today: key === todayKey }
  })
}

/** Quita días antiguos y duplicados. */
export function pruneActivity(activity: readonly string[], today: Date): string[] {
  const oldest = dayKey(addDays(today, -KEEP_DAYS))
  return [...new Set(activity)].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= oldest).sort()
}
