/**
 * Almacenamiento local tolerante a fallos (modo privado, datos bloqueados, cuota).
 * Solo preferencias y, si la persona lo activa, progreso. Nunca datos de pacientes ni consultas.
 */
export const PREFIX = 'matilde:'
export const PREFS_KEY = `${PREFIX}prefs`

export function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* sin almacenamiento: la app sigue funcionando en memoria */
  }
}

/** Borra todo lo que esta app guardó en el dispositivo. */
export function removeAll(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
    window.sessionStorage.clear()
  } catch {
    /* nada que borrar */
  }
}
