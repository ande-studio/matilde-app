/**
 * Motor de la ruta "¿Qué hago?" (SDD 002): árbol de decisión determinístico, sin IA.
 *
 * Es una función pura: `(árbol, respuestas) → salidas`. No guarda nada y no usa texto libre.
 * Semántica de las reglas (en orden):
 *  - Una regla coincide si TODAS sus condiciones `si` se cumplen (o es `porDefecto`).
 *  - La primera con `salida` que coincide es la salida principal.
 *  - `agregarPrimero` / `agregar` suman bloques antes / después de la principal.
 *  - Una regla con `termina` y `salida` finaliza de inmediato (p. ej. peligro ahora).
 *  - Las respuestas a preguntas ocultas (`mostrarSi`) se ignoran.
 */
import type { Pregunta, Regla, Ruta } from '../../schemas/content'

export type Answers = Partial<Record<string, string>>
export type RutaTree = Pick<Ruta, 'preguntas' | 'reglas'>

export interface RutaResult {
  /** La ruta terminó de inmediato (emergencia). */
  terminated: boolean
  /** Salida principal (null solo si todavía no hay ninguna regla aplicable). */
  main: string | null
  /** Salidas en el orden en que deben mostrarse (sin duplicados). */
  ordered: string[]
}

export function isVisible(question: Pregunta, answers: Answers): boolean {
  return Object.entries(question.mostrarSi ?? {}).every(([id, values]) => {
    const answer = answers[id]
    return answer !== undefined && values.includes(answer)
  })
}

/** Respuestas válidas: descarta las de preguntas ocultas y las opciones inexistentes. */
export function effectiveAnswers(tree: RutaTree, answers: Answers): Answers {
  const result: Answers = {}
  for (const question of tree.preguntas) {
    if (!isVisible(question, result)) continue
    const answer = answers[question.id]
    if (answer !== undefined && question.opciones.includes(answer)) result[question.id] = answer
  }
  return result
}

export function matches(rule: Regla, answers: Answers): boolean {
  if (rule.porDefecto && !rule.si) return true
  return Object.entries(rule.si ?? {}).every(([id, expected]) => {
    const answer = answers[id]
    return answer !== undefined && [expected].flat().includes(answer)
  })
}

export function resolveRuta(tree: RutaTree, rawAnswers: Answers): RutaResult {
  const answers = effectiveAnswers(tree, rawAnswers)
  const before: string[] = []
  const after: string[] = []
  let main: string | null = null

  for (const rule of tree.reglas) {
    if (!matches(rule, answers)) continue
    if (rule.termina && rule.salida) return { terminated: true, main: rule.salida, ordered: [rule.salida] }
    if (rule.agregarPrimero) before.push(rule.agregarPrimero)
    if (rule.agregar) after.push(rule.agregar)
    if (rule.salida && main === null) main = rule.salida
  }
  return { terminated: false, main, ordered: [...new Set([...before, ...(main ? [main] : []), ...after])] }
}

/** Próxima pregunta visible sin responder, o null si ya se puede mostrar el resultado. */
export function nextQuestion(tree: RutaTree, rawAnswers: Answers): Pregunta | null {
  const answers = effectiveAnswers(tree, rawAnswers)
  return tree.preguntas.find((q) => isVisible(q, answers) && answers[q.id] === undefined) ?? null
}

/** Respuestas que se rellenan desde el perfil de quien usa la app (p. ej. "salud"). */
export function prefill(tree: RutaTree, role: string): Answers {
  const result: Answers = {}
  for (const question of tree.preguntas) {
    if (question.prellenarDesdePerfil && question.opciones.includes(role)) result[question.id] = role
  }
  return result
}

/** Todas las combinaciones posibles de respuestas (respetando la visibilidad). Para pruebas y auditoría. */
export function allCombinations(tree: RutaTree): Answers[] {
  const combos: Answers[] = []
  const walk = (index: number, answers: Answers): void => {
    const question = tree.preguntas[index]
    if (!question) {
      combos.push({ ...answers })
      return
    }
    if (!isVisible(question, answers)) {
      walk(index + 1, answers)
      return
    }
    for (const option of question.opciones) walk(index + 1, { ...answers, [question.id]: option })
  }
  walk(0, {})
  return combos
}
