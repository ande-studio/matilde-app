import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ContentFile, Review } from '../schemas/content'
import { availableLocales, isAvailable, requiredReviews } from '../schemas/gating'
import { buildContent, checkIntegrity, loadContentFiles, type LoadedFile } from '../tools/lib/content-build'

const approved = (type: string) => ({ type, status: 'approved', by: 'revisor/a', date: '2026-11-10', version: 1 })

function guide(overrides: Record<string, unknown> = {}) {
  return ContentFile.parse({
    kind: 'guide',
    id: 'guia-de-prueba',
    topic: 'educacion_sexual',
    category: 'abordar',
    order: 1,
    rights: ['informacion'],
    locales: { es: { title: 'Guía', sections: [] }, qu: { title: 'Yachay', sections: [] } },
    ...overrides,
  })
}

const file = (data: ContentFile): LoadedFile => ({ path: `${data.id}.json`, data })

describe('esquema de contenido', () => {
  it('rechaza una revisión aprobada sin quién, cuándo y versión', () => {
    expect(Review.safeParse({ type: 'sanitaria', status: 'approved' }).success).toBe(false)
    expect(Review.safeParse(approved('sanitaria')).success).toBe(true)
  })

  it('exige al menos un derecho asociado', () => {
    expect(() => guide({ rights: [] })).toThrow()
  })

  it('exige exactamente una opción correcta en una actividad', () => {
    const activity = {
      prompt: '¿?',
      options: [
        { id: 'a', text: 'a', correct: true, feedback: '' },
        { id: 'b', text: 'b', correct: true, feedback: '' },
      ],
    }
    expect(() =>
      ContentFile.parse({
        kind: 'lesson',
        id: 'leccion',
        topic: 'educacion_sexual',
        category: 'abordar',
        order: 1,
        durationMin: 4,
        rights: ['informacion'],
        locales: { es: { title: 'L', sections: [], activity } },
      }),
    ).toThrow()
  })
})

describe('revisiones obligatorias (tabla del SDD)', () => {
  it('educación sexual para profesionales: sanitaria, lingüística y comunitaria', () => {
    expect(requiredReviews(guide())).toEqual(['sanitaria', 'linguistica', 'comunitaria'])
  })

  it('suma protección infantil cuando es para menores de 12 o es material para la paciente', () => {
    expect(requiredReviews(guide({ ageBands: ['9-11'] }))).toContain('proteccion_infantil')
    const share = ContentFile.parse({
      kind: 'share',
      id: 'mensaje',
      topic: 'educacion_sexual',
      category: 'abordar',
      order: 1,
      ageBands: ['12-14'],
      rights: ['informacion'],
      locales: { es: { title: 'M', sections: [] } },
    })
    expect(requiredReviews(share)).toContain('proteccion_infantil')
  })

  it('abuso y violencia exigen también revisión legal (regla estricta, Q31)', () => {
    expect(requiredReviews(guide({ topic: 'abuso_violencia' }))).toContain('legal')
  })
})

describe('canales de publicación', () => {
  const full = {
    es: ['sanitaria', 'linguistica', 'comunitaria'].map(approved),
    qu: [approved('linguistica')],
  }

  it('draft y review incluyen contenido sin aprobar; production no', () => {
    const g = guide()
    expect(isAvailable(g, 'es', 'draft')).toBe(true)
    expect(isAvailable(g, 'es', 'review')).toBe(true)
    expect(isAvailable(g, 'es', 'production')).toBe(false)
  })

  it('production incluye solo los idiomas con todas las revisiones aprobadas', () => {
    const g = guide({ reviews: full })
    expect(availableLocales(g, 'production')).toEqual(['es'])
  })

  it('review excluye lo rechazado', () => {
    const g = guide({ reviews: { es: [{ type: 'sanitaria', status: 'rejected' }], qu: [] } })
    expect(isAvailable(g, 'es', 'review')).toBe(false)
    expect(isAvailable(g, 'qu', 'review')).toBe(true)
  })

  it('las piezas alwaysAvailable viajan en todos los canales', () => {
    const ayuda = ContentFile.parse({
      kind: 'ayuda',
      id: 'ayuda-pe',
      topic: 'rutas_denuncia',
      pais: 'PE',
      rights: ['proteccion'],
      alwaysAvailable: true,
      lines: [{ id: 'linea-100', number: '100', verifiedAt: null, responsable: null, locales: { es: { label: 'Línea 100', detail: '' } } }],
    })
    expect(isAvailable(ayuda, 'es', 'production')).toBe(true)
  })

  it('buildContent en production no deja texto sin aprobar y quita idiomas no incluidos', () => {
    const files = [
      file(guide({ id: 'aprobada', reviews: full })),
      file(guide({ id: 'pendiente' })),
    ]
    const out = buildContent(files, 'production', new Date('2026-11-10T00:00:00Z'))
    expect(out.pieces.map((p) => p.id)).toEqual(['aprobada'])
    const piece = out.pieces[0]
    expect(piece && 'locales' in piece && Object.keys(piece.locales)).toEqual(['es'])
    expect(out.stats).toMatchObject({ total: 2, included: 1, excluded: 1 })
  })

  it('la versión cambia solo si cambia el contenido incluido', () => {
    const a = buildContent([file(guide())], 'review', new Date('2026-01-01'))
    const b = buildContent([file(guide())], 'review', new Date('2027-01-01'))
    const c = buildContent([file(guide({ order: 2 }))], 'review', new Date('2026-01-01'))
    expect(a.meta.version).toBe(b.meta.version)
    expect(a.meta.version).not.toBe(c.meta.version)
  })
})

describe('contenido real del repositorio', () => {
  const dir = resolve(process.cwd(), 'content')

  it('es válido y consistente', async () => {
    const files = await loadContentFiles(dir)
    expect(files.length).toBeGreaterThan(10)
    expect(checkIntegrity(files)).toEqual([])
  })

  it('todo el contenido semilla está sin aprobar (no hay revisiones inventadas)', async () => {
    const files = await loadContentFiles(dir)
    for (const { data } of files) {
      for (const locale of ['es', 'qu'] as const) {
        expect(data.reviews[locale].every((r) => r.status !== 'approved'), data.id).toBe(true)
      }
    }
  })

  it('production solo lleva la ayuda de emergencia mientras nada esté aprobado', async () => {
    const files = await loadContentFiles(dir)
    const out = buildContent(files, 'production')
    expect(out.pieces.map((p) => p.kind)).toEqual(['ayuda'])
  })

  it('detecta referencias rotas en la ruta', async () => {
    const files = await loadContentFiles(dir)
    const broken = structuredClone(files)
    const ruta = broken.find((f) => f.data.kind === 'ruta')
    if (ruta?.data.kind !== 'ruta') throw new Error('falta la ruta')
    ruta.data.reglas[0]!.salida = 'no_existe'
    ruta.data.salidas[0]!.calls = ['linea-inexistente']
    const problems = checkIntegrity(broken)
    expect(problems.some((p) => p.includes('"no_existe"'))).toBe(true)
    expect(problems.some((p) => p.includes('"linea-inexistente"'))).toBe(true)
  })
})
