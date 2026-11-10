import { resetSession } from '../state/session'
import { resetRouter } from '../state/router'

/** Indirección para poder verificar la salida en pruebas sin navegar de verdad. */
export const exitApi = {
  replace: (url: string): void => window.location.replace(url),
}

/**
 * "Salir rápido": descarta el estado en memoria y reemplaza la página por una pantalla neutra
 * (`replace` no deja la app en el historial de esa pestaña). Es una página propia y precacheada,
 * por lo que también funciona sin conexión.
 *
 * Límites (documentados en la app): no borra el historial previo del navegador ni cierra la app
 * instalada ni la quita de "recientes".
 */
export function quickExit(): void {
  resetSession()
  resetRouter()
  exitApi.replace(`${import.meta.env.BASE_URL}neutral.html`)
}
