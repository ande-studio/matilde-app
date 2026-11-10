/**
 * Forma del archivo generado `src/generated/content.json`, que consume la app.
 * Lo produce tools/build-content.ts a partir de `content/` según el canal.
 */
import type { Channel } from './gating'
import type { ContentFile, Locale, ReviewType } from './content'

/** Estado de revisión de una pieza en un idioma, calculado en el build. */
export interface PieceReview {
  approved: boolean
  missing: ReviewType[]
}

/** Una pieza incluida en el canal, con solo los idiomas disponibles. */
export type GeneratedPiece<K extends ContentFile = ContentFile> = K & {
  /** Estado de revisión por idioma incluido. */
  review: Partial<Record<Locale, PieceReview>>
}

export interface GeneratedContent {
  meta: {
    channel: Channel
    /** Hash corto del contenido incluido (versión visible en Ajustes). */
    version: string
    generatedAt: string
  }
  stats: {
    total: number
    included: number
    excluded: number
    approvedLocales: number
    pendingLocales: number
  }
  pieces: GeneratedPiece[]
}
