import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Ruta } from '../schemas/content'
import { loadContentFiles } from '../tools/lib/content-build'
import {
  allCombinations,
  effectiveAnswers,
  nextQuestion,
  prefill,
  resolveRuta,
  type Answers,
} from '../src/lib/ruta'

let ruta: Ruta

beforeAll(async () => {
  const files = await loadContentFiles(resolve(process.cwd(), 'content'))
  const found = files.find((f) => f.data.kind === 'ruta')?.data
  if (found?.kind !== 'ruta') throw new Error('Falta la ruta en content/')
  ruta = found
})

const ids = (answers: Answers) => resolveRuta(ruta, answers).ordered

describe('ruta "¿Qué hago?"', () => {
  it('el peligro ahora termina de inmediato, sin importar lo demás', () => {
    expect(ids({ peligro: 'si' })).toEqual(['emergencia'])
    expect(resolveRuta(ruta, { peligro: 'si', que: 'sexual', ultimas72h: 'si', quien: 'escuela', yo: 'docente' })).toEqual({
      terminated: true,
      main: 'emergencia',
      ordered: ['emergencia'],
    })
  })

  it('contacto sexual reciente antepone la atención de salud', () => {
    expect(ids({ peligro: 'no', que: 'sexual', ultimas72h: 'si', quien: 'comunidad', yo: 'familiar' })).toEqual([
      'salud_urgente',
      'denuncia_general',
    ])
    expect(ids({ peligro: 'no', que: 'no_decir', ultimas72h: 'no_se', quien: 'comunidad', yo: 'otra' })[0]).toBe('salud_urgente')
    expect(ids({ peligro: 'no', que: 'sexual', ultimas72h: 'no', quien: 'comunidad', yo: 'otra' })).toEqual(['denuncia_general'])
  })

  it('uniones tempranas y violencia tienen su propia salida', () => {
    expect(ids({ peligro: 'no', que: 'union', quien: 'familia', yo: 'nna' })).toEqual(['union_temprana'])
    expect(ids({ peligro: 'no', que: 'violencia', quien: 'comunidad', yo: 'salud' })).toEqual(['violencia_30364'])
  })

  it('en la escuela depende de quién consulta', () => {
    const base = { peligro: 'no', que: 'no_decir', ultimas72h: 'no', quien: 'escuela' }
    expect(ids({ ...base, yo: 'docente' })).toEqual(['escuela_docente'])
    expect(ids({ ...base, yo: 'familiar' })).toEqual(['escuela_familia'])
    expect(ids({ ...base, yo: 'otra' })).toEqual(['escuela_familia'])
  })

  it('el personal de salud ve su obligación de denunciar y, si es por internet, la evidencia digital', () => {
    expect(ids({ peligro: 'no', que: 'sexual', ultimas72h: 'no', quien: 'comunidad', yo: 'salud' })).toEqual(['personal_salud'])
    expect(ids({ peligro: 'no', que: 'sexual', ultimas72h: 'no', quien: 'internet', yo: 'salud' })).toEqual([
      'personal_salud',
      'evidencia_digital',
    ])
  })

  it('las respuestas de preguntas ocultas no cuentan', () => {
    // "ultimas72h" solo se pregunta si "que" es sexual o no_decir
    const answers = { peligro: 'no', que: 'violencia', ultimas72h: 'si', quien: 'comunidad', yo: 'otra' }
    expect(effectiveAnswers(ruta, answers)).not.toHaveProperty('ultimas72h')
    expect(ids(answers)).toEqual(['violencia_30364'])
  })

  it('la salida para la niña cuando la persona es de la familia no propone hablar con esa persona (RF-210)', () => {
    const salida = ruta.salidas.find((s) => s.id === 'familia_nna')!
    const text = [...salida.locales.es.steps, ...salida.locales.es.notes].join(' ').toLowerCase()
    expect(text).not.toMatch(/habla(r)? con (la persona|el agresor|esa persona)/)
    expect(text).toContain('otro adulto de confianza')
  })

  it('no hay preguntas de texto libre: todas ofrecen opciones cerradas (RF-202)', () => {
    for (const q of ruta.preguntas) expect(q.opciones.length).toBeGreaterThanOrEqual(2)
  })

  it('prellena "quién eres" desde el perfil', () => {
    expect(prefill(ruta, 'salud')).toEqual({ yo: 'salud' })
    expect(prefill(ruta, 'inexistente')).toEqual({})
  })

  it('avanza pregunta a pregunta hasta completar', () => {
    let answers: Answers = prefill(ruta, 'salud')
    const asked: string[] = []
    for (let guard = 0; guard < 10; guard++) {
      const q = nextQuestion(ruta, answers)
      if (!q) break
      asked.push(q.id)
      answers = { ...answers, [q.id]: q.opciones[0]! }
    }
    expect(asked[0]).toBe('peligro')
    expect(nextQuestion(ruta, answers)).toBeNull()
  })

  describe('prueba exhaustiva de combinaciones (CE-202)', () => {
    it('toda combinación produce una salida que existe y todas las llamadas existen', () => {
      const salidas = new Map(ruta.salidas.map((s) => [s.id, s]))
      const combos = allCombinations(ruta)
      expect(combos.length).toBeGreaterThan(100)
      for (const answers of combos) {
        const result = resolveRuta(ruta, answers)
        expect(result.main, JSON.stringify(answers)).not.toBeNull()
        for (const id of result.ordered) expect(salidas.has(id), `${id} en ${JSON.stringify(answers)}`).toBe(true)
      }
    })

    it('la tabla completa de combinaciones coincide con la esperada (cambiarla exige revisión legal)', async () => {
      const lines = allCombinations(ruta).map((answers) => {
        const key = ruta.preguntas.map((q) => `${q.id}=${answers[q.id] ?? '-'}`).join(' ')
        return `${key} → ${resolveRuta(ruta, answers).ordered.join(' + ')}`
      })
      await expect(lines.join('\n') + '\n').toMatchFileSnapshot('./snapshots/ruta-combinaciones.txt')
    })
  })
})
