import { signal } from '@preact/signals'
import type { Answers } from '../lib/ruta'

/**
 * Estado efímero de la sesión: solo en memoria, nunca se persiste.
 * Se descarta al salir rápido, al borrar todo y al reiniciar la ruta.
 */
export const rutaAnswers = signal<Answers>({})

export function resetSession(): void {
  rutaAnswers.value = {}
}
