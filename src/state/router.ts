import { signal } from '@preact/signals'
import type { Category } from '../../schemas/content'
import { resetUi } from './ui'

/**
 * Enrutador en memoria. A propósito NO usa la URL ni el historial del navegador:
 * lo que se consulta no debe quedar en el historial (SDD, constitución III.3).
 */
export type Route =
  | { name: 'home' }
  | { name: 'guides'; category?: Category }
  | { name: 'guide'; id: string }
  | { name: 'share' }
  | { name: 'share-view'; id: string }
  | { name: 'phrases' }
  | { name: 'route' }
  | { name: 'matilde' }
  | { name: 'training' }
  | { name: 'lesson'; id: string }
  | { name: 'settings' }

export const HOME: Route = { name: 'home' }

export const route = signal<Route>(HOME)
const history: Route[] = []

export function go(next: Route): void {
  history.push(route.value)
  route.value = next
}

/** Cambia de sección principal (navegación inferior/lateral): reinicia la pila. */
export function goRoot(next: Route): void {
  history.length = 0
  route.value = next
}

export function back(): void {
  route.value = history.pop() ?? HOME
}

export function canGoBack(): boolean {
  return history.length > 0
}

export function resetRouter(): void {
  history.length = 0
  route.value = HOME
  resetUi()
}
