import { registerSW } from 'virtual:pwa-register'

export interface PwaCallbacks {
  /** Hay una versión nueva descargada; la persona decide cuándo actualizar. */
  onNeedRefresh: () => void
  /** El contenido ya está disponible sin conexión. */
  onOfflineReady: () => void
}

/** Registra el service worker y devuelve la función que aplica la actualización. */
export function setupPwa({ onNeedRefresh, onOfflineReady }: PwaCallbacks): () => Promise<void> {
  // En el visor móvil incrustado no hay service worker (el documento no tiene origen propio).
  if (window.__MATILDE_EMBED__) return async () => {}
  const update = registerSW({ onNeedRefresh, onOfflineReady })
  return () => update(true)
}
