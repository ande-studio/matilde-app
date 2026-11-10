/**
 * Lógica del empaquetador de contenido: lectura, validación, integridad y selección por canal.
 * El CLI (tools/build-content.ts) y las pruebas usan estas funciones.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { ContentFile, LOCALES, type Locale } from '../../schemas/content'
import { availableLocales, reviewState, type Channel } from '../../schemas/gating'
import type { GeneratedContent, GeneratedPiece, PieceReview } from '../../schemas/generated'

export interface LoadedFile {
  path: string
  data: ContentFile
}

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Contenido inválido (${problems.length} problema${problems.length === 1 ? '' : 's'})`)
  }
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : Promise.resolve([join(dir, e.name)]))),
  )
  return files.flat().filter((f) => f.endsWith('.json')).sort()
}

/** Lee y valida con el esquema todos los `.json` de `dir`. Lanza ContentError si hay problemas. */
export async function loadContentFiles(dir: string): Promise<LoadedFile[]> {
  const problems: string[] = []
  const loaded: LoadedFile[] = []
  for (const file of await walk(dir)) {
    const rel = relative(dir, file)
    let json: unknown
    try {
      json = JSON.parse(await readFile(file, 'utf8'))
    } catch (error) {
      problems.push(`${rel}: JSON inválido (${(error as Error).message})`)
      continue
    }
    const parsed = ContentFile.safeParse(json)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push(`${rel}: ${issue.path.join('.') || '(raíz)'} → ${issue.message}`)
      }
      continue
    }
    loaded.push({ path: rel, data: parsed.data })
  }
  problems.push(...checkIntegrity(loaded))
  if (problems.length) throw new ContentError(problems)
  return loaded
}

/** Reglas que el esquema por sí solo no puede expresar (referencias cruzadas, unicidad, árbol). */
export function checkIntegrity(files: LoadedFile[]): string[] {
  const problems: string[] = []
  const seen = new Map<string, string>()
  for (const { path, data } of files) {
    const previous = seen.get(data.id)
    if (previous) problems.push(`${path}: id duplicado "${data.id}" (ya está en ${previous})`)
    seen.set(data.id, path)
  }

  const lines = new Set<string>()
  for (const { data } of files) if (data.kind === 'ayuda') data.lines.forEach((l) => lines.add(l.id))
  if (!files.some((f) => f.data.kind === 'ayuda')) {
    problems.push('Falta el archivo de ayuda (kind "ayuda"): los números de emergencia son obligatorios')
  }

  for (const { path, data } of files) {
    if (data.kind !== 'ruta') continue
    const preguntas = new Map(data.preguntas.map((p) => [p.id, p]))
    const salidas = new Set(data.salidas.map((s) => s.id))
    const err = (msg: string) => problems.push(`${path}: ${msg}`)

    if (data.reglas.filter((r) => r.porDefecto).length !== 1) err('debe haber exactamente una regla porDefecto')
    if (!data.reglas[data.reglas.length - 1]?.porDefecto) err('la regla porDefecto debe ser la última')

    data.reglas.forEach((r, i) => {
      const at = `reglas[${i}]`
      for (const id of [r.salida, r.agregar, r.agregarPrimero]) {
        if (id && !salidas.has(id)) err(`${at}: la salida "${id}" no existe`)
      }
      if (!r.porDefecto && !r.si) err(`${at}: una regla sin "si" debe ser porDefecto`)
      if (!r.salida && !r.agregar && !r.agregarPrimero) err(`${at}: la regla no produce ninguna salida`)
      for (const [qid, expected] of Object.entries(r.si ?? {})) {
        const q = preguntas.get(qid)
        if (!q) err(`${at}: la pregunta "${qid}" no existe`)
        else for (const v of [expected].flat()) if (!q.opciones.includes(v)) err(`${at}: "${v}" no es opción de "${qid}"`)
      }
    })

    for (const p of data.preguntas) {
      for (const [qid, values] of Object.entries(p.mostrarSi ?? {})) {
        const q = preguntas.get(qid)
        if (!q) err(`pregunta "${p.id}": mostrarSi apunta a la pregunta inexistente "${qid}"`)
        else for (const v of values) if (!q.opciones.includes(v)) err(`pregunta "${p.id}": "${v}" no es opción de "${qid}"`)
      }
      const text = data.locales.es.preguntas[p.id]
      if (!text) err(`falta el texto en español de la pregunta "${p.id}"`)
      else for (const o of p.opciones) if (!text.opciones[o]) err(`falta la etiqueta de la opción "${p.id}.${o}"`)
    }

    for (const s of data.salidas) {
      for (const c of s.calls) if (!lines.has(c)) err(`salida "${s.id}": la línea de ayuda "${c}" no existe`)
    }
  }
  return problems
}

function pieceReview(piece: ContentFile, locale: Locale): PieceReview {
  const { approved, missing } = reviewState(piece, locale)
  return { approved, missing }
}

/** Selecciona y recorta el contenido para un canal. */
export function buildContent(files: LoadedFile[], channel: Channel, now = new Date()): GeneratedContent {
  const pieces: GeneratedPiece[] = []
  let approvedLocales = 0
  let pendingLocales = 0

  for (const { data } of files) {
    const included = availableLocales(data, channel).filter((l) => hasLocale(data, l))
    if (included.length === 0) continue

    const review: Partial<Record<Locale, PieceReview>> = {}
    for (const l of included) {
      review[l] = pieceReview(data, l)
      if (review[l]?.approved) approvedLocales++
      else pendingLocales++
    }
    pieces.push({ ...stripLocales(data, included), review })
  }

  pieces.sort((a, b) => a.kind.localeCompare(b.kind) || orderOf(a) - orderOf(b) || a.id.localeCompare(b.id))
  const hash = createHash('sha256').update(JSON.stringify(pieces)).digest('hex').slice(0, 8)

  return {
    meta: { channel, version: hash, generatedAt: now.toISOString() },
    stats: {
      total: files.length,
      included: pieces.length,
      excluded: files.length - pieces.length,
      approvedLocales,
      pendingLocales,
    },
    pieces,
  }
}

function orderOf(piece: ContentFile): number {
  return 'order' in piece ? piece.order : 0
}

function hasLocale(piece: ContentFile, locale: Locale): boolean {
  if (piece.kind === 'ayuda') return true
  // Las frases viven en la tabla de ítems: hay "quechua" solo si alguna frase ya tiene propuesta
  if (piece.kind === 'phrases' && locale === 'qu') return piece.items.some((i) => i.qu)
  if (piece.kind === 'phrases') return true
  const locales = piece.locales as Partial<Record<Locale, unknown>>
  return locales[locale] !== undefined
}

/** Quita de la pieza los idiomas no incluidos (producción no debe llevar texto sin aprobar). */
function stripLocales<T extends ContentFile>(piece: T, keep: Locale[]): T {
  const copy = structuredClone(piece) as T
  if (copy.kind === 'ayuda') {
    for (const line of copy.lines) {
      const loc = line.locales as Partial<Record<Locale, unknown>>
      for (const l of LOCALES) if (!keep.includes(l)) delete loc[l]
    }
    return copy
  }
  const loc = copy.locales as Partial<Record<Locale, unknown>>
  for (const l of LOCALES) if (!keep.includes(l)) delete loc[l]
  if (copy.kind === 'phrases' && !keep.includes('qu')) {
    for (const item of copy.items) {
      item.qu = null
      item.pron = null
    }
  }
  if (copy.kind === 'ruta') {
    for (const s of copy.salidas) {
      const sl = s.locales as Partial<Record<Locale, unknown>>
      for (const l of LOCALES) if (!keep.includes(l)) delete sl[l]
    }
  }
  return copy
}
