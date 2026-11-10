/**
 * Canales de publicación y revisiones obligatorias.
 *
 *  - draft:      todo el contenido (desarrollo local).
 *  - review:     todo salvo lo rechazado, con avisos de estado (piloto controlado).
 *  - production: solo lo que tiene TODAS las revisiones requeridas aprobadas, por idioma.
 *
 * Excepción: las piezas `alwaysAvailable` (números nacionales de emergencia) viajan en todos los
 * canales, con su estado visible ("por confirmar"), porque la seguridad no puede depender de
 * que una revisión termine (SDD, constitución VIII.3).
 */
import type { ContentFile, Locale, ReviewType } from './content'
import { LOCALES } from './content'

export const CHANNELS = ['draft', 'review', 'production'] as const
export type Channel = (typeof CHANNELS)[number]

export function isChannel(value: string | undefined): value is Channel {
  return !!value && (CHANNELS as readonly string[]).includes(value)
}

type Gated = Pick<ContentFile, 'kind' | 'topic' | 'reviews' | 'alwaysAvailable'> & {
  ageBands?: readonly string[]
}

/**
 * Revisiones obligatorias por pieza (tabla del SDD, 000).
 * Decisiones de la base de conocimiento: contenido de abuso/violencia exige también revisión legal
 * (regla estricta, Q31) y la protección infantil se aplica a material para menores de 12.
 */
export function requiredReviews(piece: Gated): ReviewType[] {
  if (piece.kind === 'phrases') return ['linguistica', 'comunitaria', 'proteccion_infantil']
  const minors = piece.kind === 'share' || (piece.ageBands ?? []).includes('9-11')
  switch (piece.topic) {
    case 'educacion_sexual':
      return minors
        ? ['sanitaria', 'linguistica', 'comunitaria', 'proteccion_infantil']
        : ['sanitaria', 'linguistica', 'comunitaria']
    case 'abuso_violencia':
      return ['sanitaria', 'linguistica', 'comunitaria', 'proteccion_infantil', 'legal']
    case 'rutas_denuncia':
      return ['linguistica', 'comunitaria', 'proteccion_infantil', 'legal']
    case 'corpus':
      return ['sanitaria', 'linguistica', 'comunitaria', 'proteccion_infantil']
    case 'interfaz':
      return ['linguistica', 'comunitaria']
  }
}

export interface ReviewState {
  approved: boolean
  rejected: boolean
  /** Revisiones obligatorias que faltan por aprobar. */
  missing: ReviewType[]
}

export function reviewState(piece: Gated, locale: Locale): ReviewState {
  const reviews = piece.reviews[locale]
  const missing = requiredReviews(piece).filter(
    (type) => !reviews.some((r) => r.type === type && r.status === 'approved'),
  )
  return {
    approved: missing.length === 0,
    rejected: reviews.some((r) => r.status === 'rejected'),
    missing,
  }
}

/** ¿Debe incluirse esta pieza en este idioma para el canal dado? */
export function isAvailable(piece: Gated, locale: Locale, channel: Channel): boolean {
  if (piece.alwaysAvailable) return true
  const state = reviewState(piece, locale)
  switch (channel) {
    case 'draft':
      return true
    case 'review':
      return !state.rejected
    case 'production':
      return state.approved && !state.rejected
  }
}

export function availableLocales(piece: Gated, channel: Channel): Locale[] {
  return LOCALES.filter((l) => isAvailable(piece, l, channel))
}
