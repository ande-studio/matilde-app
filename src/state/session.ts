import { signal } from '@preact/signals'
import type { DemoPromptId, DemoRoleId } from '../demo/matilde'
import type { Answers } from '../lib/ruta'

/**
 * Estado efímero de la sesión: solo en memoria, nunca se persiste.
 * Se descarta al salir rápido, al borrar todo y al reiniciar la ruta.
 */
export const rutaAnswers = signal<Answers>({})

/** Demo de "Conversar con Matilde" (simulada): rol elegido y preguntas ya hechas. Nada de esto se guarda. */
export interface DemoTurn {
  prompt: DemoPromptId
  /** La respuesta ya terminó de mostrarse (no se vuelve a animar). */
  done: boolean
}
export const demoRole = signal<DemoRoleId | null>(null)
export const demoTurns = signal<DemoTurn[]>([])

export function resetDemo(): void {
  demoRole.value = null
  demoTurns.value = []
}

export function resetSession(): void {
  rutaAnswers.value = {}
  resetDemo()
}
