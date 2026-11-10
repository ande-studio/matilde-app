/**
 * Esquemas del contenido de Matilde (fuente de verdad del formato de `content/`).
 * Se usan en el empaquetador (tools/build-content.ts) y sus tipos en la app.
 *
 * Principios (ver matilde-knowledge-base, ADR-0003 y SDD v1.2):
 *  - Identificadores estables (nunca por posición).
 *  - Cada pieza declara tema, derecho asociado, fuentes y estado de revisión por idioma.
 *  - Una revisión aprobada registra quién, cuándo y sobre qué versión.
 */
import { z } from 'zod'

export const LOCALES = ['es', 'qu'] as const
export const Locale = z.enum(LOCALES)
export type Locale = z.infer<typeof Locale>

export const REVIEW_TYPES = [
  'sanitaria',
  'linguistica',
  'comunitaria',
  'proteccion_infantil',
  'legal',
] as const
export const ReviewType = z.enum(REVIEW_TYPES)
export type ReviewType = z.infer<typeof ReviewType>

export const ReviewStatus = z.enum(['pending', 'approved', 'rejected'])
export type ReviewStatus = z.infer<typeof ReviewStatus>

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha esperada AAAA-MM-DD')

export const Review = z
  .strictObject({
    type: ReviewType,
    status: ReviewStatus,
    by: z.string().min(1).optional(),
    date: isoDate.optional(),
    version: z.number().int().positive().optional(),
    notes: z.string().optional(),
  })
  .refine((r) => r.status !== 'approved' || (r.by && r.date && r.version !== undefined), {
    message: 'Una revisión aprobada debe registrar quién (by), cuándo (date) y sobre qué versión (version)',
  })
export type Review = z.infer<typeof Review>

export const Reviews = z
  .strictObject({
    es: z.array(Review).default([]),
    qu: z.array(Review).default([]),
  })
  .default({ es: [], qu: [] })
export type Reviews = z.infer<typeof Reviews>

/** Temas del SDD (tabla de revisiones obligatorias). */
export const Topic = z.enum([
  'educacion_sexual',
  'abuso_violencia',
  'rutas_denuncia',
  'corpus',
  'interfaz',
])
export type Topic = z.infer<typeof Topic>

export const AgeBand = z.enum(['9-11', '12-14'])
export type AgeBand = z.infer<typeof AgeBand>

export const Category = z.enum(['abordar', 'menstruacion', 'evaluar', 'cuidados', 'mitos', 'proteccion'])
export type Category = z.infer<typeof Category>

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Identificador en kebab-case')

export const Section = z.strictObject({
  heading: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  bullets: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  callout: z.strictObject({ tone: z.enum(['info', 'warning', 'safety']), text: z.string() }).optional(),
})
export type Section = z.infer<typeof Section>

export const Activity = z
  .strictObject({
    prompt: z.string(),
    options: z
      .array(z.strictObject({ id, text: z.string(), correct: z.boolean(), feedback: z.string() }))
      .min(2),
  })
  .refine((a) => a.options.filter((o) => o.correct).length === 1, {
    message: 'Una actividad debe tener exactamente una opción correcta',
  })
export type Activity = z.infer<typeof Activity>

export const LocalizedText = z.strictObject({
  title: z.string().min(1),
  summary: z.string().optional(),
  sections: z.array(Section).default([]),
  activity: Activity.optional(),
})
export type LocalizedText = z.infer<typeof LocalizedText>

export const Locales = z.strictObject({ es: LocalizedText, qu: LocalizedText.optional() })

export const Source = z.strictObject({
  label: z.string(),
  url: z.url().optional(),
  retrievedAt: isoDate.optional(),
})
export type Source = z.infer<typeof Source>

export const Curriculum = z
  .strictObject({
    cneb: z.array(z.string()).default([]),
    rvm085: z.array(z.string()).default([]),
    unicefAreas: z.array(z.string()).default([]),
    onu2018: z.array(z.string()).default([]),
    sddRef: z.string().optional(),
  })
  .optional()

const base = {
  id,
  topic: Topic,
  category: Category,
  order: z.number().int().nonnegative(),
  ageBands: z.array(AgeBand).default([]),
  rights: z.array(z.string()).min(1, 'Cada pieza debe declarar al menos un derecho asociado'),
  sources: z.array(Source).default([]),
  curriculum: Curriculum,
  reviews: Reviews,
  alwaysAvailable: z.boolean().default(false),
}

export const Guide = z.strictObject({ ...base, kind: z.literal('guide'), locales: Locales })
export const Lesson = z.strictObject({
  ...base,
  kind: z.literal('lesson'),
  durationMin: z.number().int().positive(),
  locales: Locales,
})
export const Share = z.strictObject({
  ...base,
  kind: z.literal('share'),
  /** Banda de edad de la persona que lee (obligatoria para el Modo consulta). */
  ageBands: z.array(AgeBand).min(1),
  locales: Locales,
})

export const Phrase = z.strictObject({
  id,
  es: z.string().min(1),
  /** Propuesta en quechua; `null` = pendiente de traducir. No se inventan traducciones. */
  qu: z.string().min(1).nullable().default(null),
  /** Guía de pronunciación (pendiente de revisión lingüística). */
  pron: z.string().nullable().default(null),
  quSource: z.string().optional(),
})
export type Phrase = z.infer<typeof Phrase>

export const Phrases = z.strictObject({
  ...base,
  kind: z.literal('phrases'),
  locales: Locales,
  items: z.array(Phrase).min(1),
})

/* ---------- Ruta "¿Qué hago?" (árbol determinístico, ver SDD 002) ---------- */

export const Pregunta = z.strictObject({
  id,
  opciones: z.array(z.string().regex(/^[a-z0-9_]+$/)).min(2),
  /** La pregunta solo se muestra si la respuesta a otra pregunta está en la lista. */
  mostrarSi: z.record(z.string(), z.array(z.string())).optional(),
  prellenarDesdePerfil: z.boolean().optional(),
})
export type Pregunta = z.infer<typeof Pregunta>

export const Regla = z.strictObject({
  si: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  salida: z.string().optional(),
  agregarPrimero: z.string().optional(),
  agregar: z.string().optional(),
  /** Si la regla coincide, la ruta termina de inmediato con esta salida. */
  termina: z.boolean().optional(),
  porDefecto: z.boolean().optional(),
})
export type Regla = z.infer<typeof Regla>

export const SalidaText = z.strictObject({
  title: z.string(),
  steps: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
})
export type SalidaText = z.infer<typeof SalidaText>

export const Salida = z.strictObject({
  id: z.string().regex(/^[a-z0-9_]+$/),
  /** Tipos de servicio a listar (comisaria, fiscalia, cem, demuna, ...). */
  serviceTypes: z.array(z.string()).default([]),
  /** Ids de líneas de ayuda (ayuda/pe.json) a mostrar como llamada. */
  calls: z.array(z.string()).default([]),
  incluyeLoQueDebesSaber: z.boolean().default(false),
  locales: z.strictObject({ es: SalidaText, qu: SalidaText.optional() }),
})
export type Salida = z.infer<typeof Salida>

export const PreguntaText = z.strictObject({
  text: z.string(),
  opciones: z.record(z.string(), z.string()),
})

export const Ruta = z.strictObject({
  kind: z.literal('ruta'),
  id,
  topic: z.literal('rutas_denuncia'),
  pais: z.string().length(2),
  version: z.string(),
  /** Fecha de vigencia legal y responsable (SDD RF-215). `null` = sin validar. */
  vigenciaLegal: isoDate.nullable(),
  responsableLegal: z.string().nullable(),
  rights: z.array(z.string()).min(1),
  sources: z.array(Source).default([]),
  reviews: Reviews,
  alwaysAvailable: z.boolean().default(false),
  preguntas: z.array(Pregunta).min(1),
  reglas: z.array(Regla).min(1),
  salidas: z.array(Salida).min(1),
  loQueDebesSaber: z.strictObject({
    locales: z.strictObject({
      es: z.strictObject({ title: z.string(), items: z.array(z.string()).min(1) }),
    }),
  }),
  locales: z.strictObject({
    es: z.strictObject({ preguntas: z.record(z.string(), PreguntaText) }),
  }),
})
export type Ruta = z.infer<typeof Ruta>

/* ---------- Ayuda ("Necesito ayuda"): números del paquete legal del país ---------- */

export const HelpLine = z.strictObject({
  id,
  number: z.string().regex(/^\d{2,6}$/),
  /** Fecha de verificación (SDD VIII). `null` = "por confirmar". */
  verifiedAt: isoDate.nullable(),
  responsable: z.string().nullable(),
  source: z.url().optional(),
  locales: z.strictObject({
    es: z.strictObject({ label: z.string(), detail: z.string() }),
    qu: z.strictObject({ label: z.string(), detail: z.string() }).optional(),
  }),
})
export type HelpLine = z.infer<typeof HelpLine>

export const Ayuda = z.strictObject({
  kind: z.literal('ayuda'),
  id,
  topic: z.literal('rutas_denuncia'),
  pais: z.string().length(2),
  rights: z.array(z.string()).min(1),
  reviews: Reviews,
  /** Los números nacionales de emergencia forman parte del núcleo y siempre están disponibles. */
  alwaysAvailable: z.literal(true),
  lines: z.array(HelpLine).min(1),
  sources: z.array(Source).default([]),
})
export type Ayuda = z.infer<typeof Ayuda>

export const ContentFile = z.discriminatedUnion('kind', [Guide, Lesson, Share, Phrases, Ruta, Ayuda])
export type ContentFile = z.infer<typeof ContentFile>
export type ContentKind = ContentFile['kind']
