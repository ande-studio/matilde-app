/**
 * Acceso tipado al contenido empaquetado (src/generated/content.json, creado por `npm run content`).
 */
import type {
  Ayuda,
  ContentFile,
  ContentKind,
  Locale,
  LocalizedText,
  ReviewType,
  Ruta,
} from '../schemas/content'
import type { GeneratedContent, GeneratedPiece } from '../schemas/generated'
import raw from './generated/content.json'

const content = raw as unknown as GeneratedContent

export type PieceOf<K extends ContentKind> = Extract<GeneratedPiece, { kind: K }>

export const contentMeta = content.meta

export function piecesOf<K extends ContentKind>(kind: K): PieceOf<K>[] {
  return content.pieces.filter((p): p is PieceOf<K> => p.kind === kind)
}

export function pieceById<K extends ContentKind>(kind: K, id: string): PieceOf<K> | undefined {
  return piecesOf(kind).find((p) => p.id === id)
}

export function getRuta(): (GeneratedPiece & Ruta) | undefined {
  return piecesOf('ruta')[0] as (GeneratedPiece & Ruta) | undefined
}

export function getHelpLines(): Ayuda['lines'] {
  return piecesOf('ayuda').flatMap((p) => p.lines)
}

type Localized = Extract<ContentFile, { locales: { es: LocalizedText } }>

/** Texto de una pieza en el idioma pedido, con caída al otro idioma si falta. */
export function textFor(
  piece: Pick<Localized, 'locales'>,
  locale: Locale,
): { text: LocalizedText; locale: Locale; fallback: boolean } | undefined {
  const locales = piece.locales as Partial<Record<Locale, LocalizedText>>
  const wanted = locales[locale]
  if (wanted) return { text: wanted, locale, fallback: false }
  const other: Locale = locale === 'es' ? 'qu' : 'es'
  const alt = locales[other]
  return alt ? { text: alt, locale: other, fallback: true } : undefined
}

export interface ReviewBadge {
  approved: boolean
  missing: ReviewType[]
}

export function reviewOf(piece: GeneratedPiece, locale: Locale): ReviewBadge {
  const r = piece.review[locale] ?? piece.review.es
  return { approved: r?.approved ?? false, missing: r?.missing ?? [] }
}

export function byOrder<T extends { order: number; id: string }>(a: T, b: T): number {
  return a.order - b.order || a.id.localeCompare(b.id)
}
