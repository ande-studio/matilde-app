import { signal } from '@preact/signals'

/** Estado del service worker, visible en el shell. */
export const updateReady = signal(false)
export const offlineReady = signal(false)
/** Aplica la actualización descargada (la asigna main.tsx al registrar el service worker). */
export const applyUpdate = signal<(() => Promise<void>) | null>(null)
