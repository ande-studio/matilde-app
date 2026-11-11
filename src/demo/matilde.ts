/**
 * DEMO de "Conversar con Matilde": una conversación SIMULADA con datos de ejemplo.
 *
 * - No hay IA ni red: cada pregunta sugerida tiene una respuesta escrita de antemano.
 * - No hay texto libre: la persona elige entre preguntas sugeridas (decisión del equipo: categorías y tarjetas).
 * - Estos textos NO pasan por el flujo de contenido ni por sus revisiones. Son de muestra, sin validar.
 *   Las "lecciones" que se citan son de ejemplo y la marca de revisión se muestra como SIMULADA.
 * - Lo único real son los números de ayuda: salen de `content/ayuda` (siguen "por confirmar").
 *
 * Ver docs/10 de matilde-knowledge-base (ADR-0009: la IA llega después de validar el MVP).
 */

export type DemoRoleId = 'teacher' | 'health' | 'family'
export type DemoPromptId = 'menstruation' | 'medicine' | 'abuse'

export interface DemoSource {
  title: string
  summary: string
}

export type DemoBlock =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  /** Lecciones en las que "se basa" la respuesta (de ejemplo, con revisión simulada). */
  | { type: 'sources'; items: DemoSource[] }
  /** Derivación: Matilde no improvisa y remite a quien corresponde. */
  | { type: 'refer'; title: string; text: string }
  /** Línea de ayuda real (desde `content/ayuda`). */
  | { type: 'help'; lineId: string }

export interface DemoPrompt {
  id: DemoPromptId
  question: string
  blocks: DemoBlock[]
}

export interface DemoRole {
  id: DemoRoleId
  label: string
  /** Lo que "dice" la persona al elegir su rol. */
  said: string
  /** Primer mensaje de Matilde tras elegir el rol. */
  greeting: string
  prompts: DemoPrompt[]
}

/** Tiempos de la simulación (ms). Las pruebas los ponen en 0. */
export const demoTiming = { typingMs: 900, blockMs: 650 }

const REVIEWS = ['Sanitaria', 'Lingüística', 'Protección infantil'] as const
export const SIMULATED_REVIEWS: readonly string[] = REVIEWS

const medicineBlocks = (referral: DemoBlock): DemoBlock[] => [
  {
    type: 'p',
    text: 'No tengo contenido validado sobre medicamentos ni dosis, así que no voy a improvisar una respuesta.',
  },
  referral,
]

const abuseBlocks = (roleNote: string): DemoBlock[] => [
  { type: 'p', text: 'Gracias por contármelo. Lo primero es tomarlo en serio.' },
  {
    type: 'list',
    items: [
      'Escúchala con calma y créele. No la presiones para que cuente detalles.',
      'No prometas guardar el secreto: dile que vas a buscar ayuda para cuidarla.',
      'Si hay peligro ahora, busca un lugar seguro y llama al 105.',
    ],
  },
  {
    type: 'p',
    text: 'Para orientación sobre violencia puedes llamar a la Línea 100. Es gratuita y atiende en castellano, quechua y aimara.',
  },
  { type: 'help', lineId: 'linea-100' },
  { type: 'p', text: roleNote },
]

export const DEMO_ROLES: DemoRole[] = [
  {
    id: 'teacher',
    label: 'Docente',
    said: 'Soy docente.',
    greeting:
      'Mucho gusto. Puedo ayudarte con lo que enseñas y acompañas en el aula. Elige una pregunta para probar cómo respondo.',
    prompts: [
      {
        id: 'menstruation',
        question: '¿Cómo explico la menstruación a mis estudiantes?',
        blocks: [
          {
            type: 'p',
            text: 'Puedes empezar con calma y sin vergüenza: la menstruación es un proceso natural del cuerpo.',
          },
          {
            type: 'list',
            items: [
              'Elige un momento tranquilo y usa palabras sencillas.',
              'Pregunta primero qué saben y qué les gustaría entender. Escucha sin burlas ni juicios.',
              'Explica pocas ideas: qué es, por qué ocurre y que cada cuerpo tiene su ritmo.',
              'Una frase para empezar: “Si tienes preguntas sobre los cambios de tu cuerpo, podemos conversar”.',
            ],
          },
          {
            type: 'sources',
            items: [
              {
                title: 'Cambios del cuerpo y menstruación, por grado',
                summary: 'Cómo preparar una sesión según la edad.',
              },
              { title: 'Mitos y creencias que no ayudan', summary: 'Aprender sin prejuicios.' },
              { title: 'Si una estudiante tiene su regla en clase', summary: 'Acompañar con discreción.' },
            ],
          },
        ],
      },
      {
        id: 'medicine',
        question: 'Una estudiante tiene mucho dolor. ¿Qué medicina le puedo dar?',
        blocks: medicineBlocks({
          type: 'refer',
          title: 'Derivación: establecimiento de salud',
          text: 'Lo más seguro es que la estudiante sea vista en un establecimiento de salud, donde el personal puede orientarla. Avisa también a su familia o a una persona adulta responsable.',
        }),
      },
      {
        id: 'abuse',
        question:
          'Una estudiante me contó que un adulto la hace sentir insegura y le pidió guardar el secreto. ¿Qué hago?',
        blocks: abuseBlocks(
          'Tu institución puede tener pasos propios que seguir. La ruta “¿Qué hago?” te los ordena (pendiente de revisión legal).',
        ),
      },
    ],
  },
  {
    id: 'health',
    label: 'Personal de salud',
    said: 'Soy personal de salud.',
    greeting:
      'Mucho gusto. Puedo ayudarte a orientar a niñas y adolescentes en la consulta. Elige una pregunta para probar cómo respondo.',
    prompts: [
      {
        id: 'menstruation',
        question: '¿Cómo explico la menstruación a una adolescente y su familia en la consulta?',
        blocks: [
          {
            type: 'p',
            text: 'Puedes abrir la conversación preguntando qué sabe y qué le gustaría entender, sin apuro y con palabras sencillas.',
          },
          {
            type: 'list',
            items: [
              'Normaliza: es un proceso natural y cada cuerpo tiene su ritmo.',
              'Aclara los mitos con respeto, sin burlas ni juicios.',
              'Invita a la familia a acompañar y deja un espacio para preguntas.',
            ],
          },
          {
            type: 'sources',
            items: [
              { title: 'Orientar a la adolescente y su familia', summary: 'Una consulta cercana.' },
              { title: 'Qué es esperable y cuándo evaluar', summary: 'Orientación para la consulta.' },
            ],
          },
        ],
      },
      {
        id: 'medicine',
        question: 'Una paciente pide algo para el dolor. ¿Qué medicamento y dosis le indico?',
        blocks: medicineBlocks({
          type: 'refer',
          title: 'Derivación: norma técnica de tu establecimiento',
          text: 'Para indicaciones y dosis, sigue la norma técnica vigente y el criterio clínico de tu establecimiento. Consulta con tu jefatura o con el servicio correspondiente.',
        }),
      },
      {
        id: 'abuse',
        question: 'Una paciente me cuenta que un adulto cercano la hace sentir insegura. ¿Qué hago?',
        blocks: abuseBlocks(
          'Tu rol puede tener obligaciones de reporte. La ruta “¿Qué hago?” las muestra para tu perfil (pendiente de revisión legal).',
        ),
      },
    ],
  },
  {
    id: 'family',
    label: 'Madre, padre o familiar',
    said: 'Soy familiar de una niña.',
    greeting:
      'Mucho gusto. Puedo ayudarte a acompañar a tu hija o a la niña que cuidas. Elige una pregunta para probar cómo respondo.',
    prompts: [
      {
        id: 'menstruation',
        question: '¿Cómo le explico la menstruación a mi hija?',
        blocks: [
          {
            type: 'p',
            text: 'Puedes preparar una conversación sencilla, en un momento tranquilo y privado. No hace falta explicarlo todo de una vez.',
          },
          {
            type: 'list',
            items: [
              'Pregúntale qué sabe y qué le gustaría entender.',
              'Dile que es un proceso natural y que puede preguntar sin vergüenza.',
              'Una frase para empezar: “Si tienes preguntas sobre los cambios de tu cuerpo, podemos conversar”.',
            ],
          },
          {
            type: 'sources',
            items: [
              { title: 'Qué es la menstruación y por qué ocurre', summary: 'Conocer el cuerpo.' },
              { title: 'Prepararla antes de su primera regla', summary: 'Acompañar con confianza.' },
            ],
          },
        ],
      },
      {
        id: 'medicine',
        question: 'Mi hija tiene mucho dolor. ¿Qué medicina le doy?',
        blocks: medicineBlocks({
          type: 'refer',
          title: 'Derivación: establecimiento de salud',
          text: 'Lo más seguro es llevarla a un establecimiento de salud para que el personal la oriente. No le des medicamentos sin esa indicación.',
        }),
      },
      {
        id: 'abuse',
        question: 'Mi hija me contó que un adulto la hace sentir insegura. ¿Qué hago?',
        blocks: abuseBlocks('La ruta “¿Qué hago?” te muestra a quién acudir paso a paso (pendiente de revisión legal).'),
      },
    ],
  },
]

export function getRole(id: DemoRoleId): DemoRole {
  return DEMO_ROLES.find((r) => r.id === id) ?? DEMO_ROLES[0]!
}

export function getPrompt(role: DemoRoleId, id: DemoPromptId): DemoPrompt | undefined {
  return getRole(role).prompts.find((p) => p.id === id)
}
