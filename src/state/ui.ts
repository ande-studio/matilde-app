import { signal } from '@preact/signals'

/**
 * Superposiciones globales (modales). Viven en memoria, igual que el enrutador:
 * abrirlas no cambia la pantalla de fondo ni deja rastro en la URL o el historial.
 */
export const helpOpen = signal(false)
export const languageOpen = signal(false)

export function openHelp(): void {
  languageOpen.value = false
  helpOpen.value = true
}

export function closeHelp(): void {
  helpOpen.value = false
}

export function resetUi(): void {
  helpOpen.value = false
  languageOpen.value = false
}
