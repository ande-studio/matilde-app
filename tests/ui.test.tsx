import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { pieceById } from '../src/content'
import { demoTiming } from '../src/demo/matilde'
import { exitApi } from '../src/lib/exit'
import { PREFS_KEY } from '../src/lib/storage'
import { eraseAll, setSaveProgress } from '../src/state/prefs'
import { go, type Route } from '../src/state/router'
import { demoRole } from '../src/state/session'

const click = (name: RegExp | string) => fireEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  window.localStorage.clear()
  eraseAll()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const ROUTES: Route[] = [
  { name: 'home' },
  { name: 'guides' },
  { name: 'guide', id: 'abordar-el-tema' },
  { name: 'share' },
  { name: 'phrases' },
  { name: 'route' },
  { name: 'training' },
  { name: 'lesson', id: 'orientar-a-la-adolescente-y-su-familia' },
  { name: 'settings' },
]

describe('seguridad siempre a mano', () => {
  it('desde el inicio, "Necesito ayuda" lleva a la Línea 100 y al 105 en 2 toques (CE-201)', async () => {
    render(<App />)
    click('Necesito ayuda')
    const links = await screen.findAllByRole('link', { name: /Llamar al/ })
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['tel:100', 'tel:105'])
  })

  it.each(ROUTES.map((r) => [r.name, r] as const))('"Necesito ayuda" y "Salir rápido" están visibles en %s', async (_name, target) => {
    render(<App />)
    go(target)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Necesito ayuda/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /Salir rápido/ })).toBeTruthy()
    })
  })

  it('en el Modo consulta se ocultan la navegación y la marca, pero siguen la ayuda y la salida', async () => {
    render(<App />)
    go({ name: 'share-view', id: 'siempre-puedes-preguntar' })
    await screen.findByRole('heading', { name: 'Siempre puedes preguntar' })
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByRole('button', { name: /Guías/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Necesito ayuda/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Salir rápido/ })).toBeTruthy()
  })

  it('"Salir rápido" reemplaza la página por la pantalla neutra', () => {
    const replace = vi.spyOn(exitApi, 'replace').mockImplementation(() => {})
    render(<App />)
    click(/Salir rápido/)
    expect(replace).toHaveBeenCalledWith('/neutral.html')
  })

  it('dos pulsaciones de Esc seguidas equivalen a "Salir rápido"', () => {
    const replace = vi.spyOn(exitApi, 'replace').mockImplementation(() => {})
    render(<App />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(replace).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(replace).toHaveBeenCalledTimes(1)
  })
})

describe('ruta "¿Qué hago?"', () => {
  it('no tiene campos de texto (RF-202) y no guarda nada', async () => {
    render(<App />)
    go({ name: 'route' })
    await screen.findByText('¿Hay peligro ahora?')
    expect(document.querySelectorAll('input, textarea').length).toBe(0)
    click('No')
    click(/Alguien la tocó/)
    click('Sí')
    click(/Alguien de la escuela/)
    await screen.findByText('Qué hacer')
    expect(document.querySelectorAll('input, textarea').length).toBe(0)
    expect(window.localStorage.getItem(PREFS_KEY)).toBeNull()
  })

  it('el peligro ahora termina de inmediato con las llamadas', async () => {
    render(<App />)
    go({ name: 'route' })
    await screen.findByText('¿Hay peligro ahora?')
    click('Sí')
    await screen.findByText('Hay peligro ahora')
    expect(screen.queryByText('¿Qué está pasando?')).toBeNull()
    const links = screen.getAllByRole('link', { name: /Llamar al/ })
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['tel:105', 'tel:100'])
  })

  it('para personal de salud muestra su obligación de denunciar y avisa que falta revisión legal', async () => {
    render(<App />)
    go({ name: 'route' })
    await screen.findByText('¿Hay peligro ahora?')
    click('No')
    click(/La golpean/)
    click(/Otra persona de la comunidad/)
    await screen.findByText('Qué hacer')
    // violencia → salida propia; el aviso de revisión pendiente siempre se muestra mientras no esté aprobada
    expect(screen.getByText(/Pendiente de revisión legal y de protección infantil/)).toBeTruthy()
    expect(screen.getByText('Lo que debes saber')).toBeTruthy()
  })

  it('permite volver a la pregunta anterior y empezar de nuevo', async () => {
    render(<App />)
    go({ name: 'route' })
    await screen.findByText('¿Hay peligro ahora?')
    click('No')
    await screen.findByText('¿Qué está pasando?')
    click('Pregunta anterior')
    await screen.findByText('¿Hay peligro ahora?')
  })
})

describe('Modo consulta', () => {
  it('lista el material según la edad y muestra el mensaje a pantalla completa', async () => {
    render(<App />)
    go({ name: 'share' })
    await screen.findByRole('heading', { name: 'Modo consulta' })
    fireEvent.click(screen.getByRole('button', { name: '9 a 11 años' }))
    await waitFor(() => expect(screen.queryByText('Tu voz también importa')).toBeNull())
    fireEvent.click(screen.getByText('Siempre puedes preguntar'))
    const article = await screen.findByRole('article')
    expect(within(article).getByText('Tus preguntas importan.')).toBeTruthy()
  })
})

describe('privacidad', () => {
  it('"Borrar todo" pide confirmación y elimina lo guardado', async () => {
    render(<App />)
    setSaveProgress(true)
    expect(window.localStorage.getItem(PREFS_KEY)).not.toBeNull()
    go({ name: 'settings' })
    await screen.findByRole('heading', { name: 'Mi perfil y ajustes' })
    click('Borrar todo de este dispositivo')
    expect(await screen.findByRole('alertdialog')).toBeTruthy()
    click('Borrar todo')
    await screen.findByText(/Se borraron tus preferencias/)
    expect(window.localStorage.getItem(PREFS_KEY)).toBeNull()
  })

  it('al cambiar a quechua se avisa que la traducción es de trabajo y lo que falta cae al español', async () => {
    render(<App />)
    click('Seleccionar idioma')
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /Runasimi/ }))
    await screen.findByText(/Runasimipi ñawpaq tikray/)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: /Yanapawanayta munani/ })).toBeTruthy()
    expect(screen.getByText('¡Qué bueno verte por aquí!')).toBeTruthy()
  })
})

describe('navegación y pantallas de la referencia', () => {
  it('la barra lateral tiene las cuatro secciones del prototipo y ajustes', () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    for (const name of ['Mi camino', 'Explorar lecciones', 'Conversar con Matilde', 'Para mostrarle']) {
      expect(within(nav).getByRole('button', { name })).toBeTruthy()
    }
    // hay dos accesos a ajustes (barra lateral y perfil móvil): CSS muestra solo uno según el ancho
    expect(screen.getAllByRole('button', { name: 'Mi perfil y ajustes' }).length).toBeGreaterThan(0)
  })

  it('"Conversar con Matilde" avisa que llega pronto, no tiene campo de texto y ofrece alternativas guiadas', async () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    fireEvent.click(within(nav).getByRole('button', { name: 'Conversar con Matilde' }))
    await screen.findByRole('heading', { name: 'Hola, soy Matilde.' })
    expect(screen.getByText('PRÓXIMAMENTE')).toBeTruthy()
    expect(screen.getByText(/Todavía no hay conversación con inteligencia artificial/)).toBeTruthy()
    expect(document.querySelectorAll('input, textarea').length).toBe(0)
    click('Sospecho violencia: ¿qué hago?')
    await screen.findByText('¿Hay peligro ahora?')
  })

  it('el inicio muestra la ruta de aprendizaje, el progreso y la racha de la semana', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Tu ruta de aprendizaje' })).toBeTruthy()
    expect(screen.getByRole('list', { name: /Días de esta semana/ }).children.length).toBe(7)
    expect(screen.getByText('Progreso solo durante esta visita.')).toBeTruthy()
    expect(screen.getByText('PRÓXIMAMENTE')).toBeTruthy()
  })

  it('"Explorar lecciones" agrupa guías, formación y frases en pestañas', async () => {
    render(<App />)
    click('Explorar lecciones')
    await screen.findByRole('heading', { name: 'Guías rápidas' })
    const tabs = screen.getByRole('group', { name: 'Qué quieres explorar' })
    fireEvent.click(within(tabs).getByRole('button', { name: 'Formación' }))
    await screen.findByRole('heading', { name: 'Formación' })
    fireEvent.click(within(screen.getByRole('group', { name: 'Qué quieres explorar' })).getByRole('button', { name: 'Frases' }))
    await screen.findByRole('heading', { name: 'Frases en quechua para la consulta' })
  })

  it('completar una lección marca el día de hoy en la semana y avanza el progreso', async () => {
    const lesson = pieceById('lesson', 'orientar-a-la-adolescente-y-su-familia')!
    const correct = lesson.locales.es.activity!.options.find((o) => o.correct)!
    render(<App />)
    go({ name: 'lesson', id: lesson.id })
    fireEvent.click(await screen.findByRole('button', { name: 'Practicar una idea' }))
    fireEvent.click(await screen.findByRole('button', { name: correct.text }))
    click('Terminar lección')
    await screen.findByRole('heading', { name: '¡Qué bueno verte por aquí!' })
    const week = screen.getByRole('list', { name: /Días de esta semana/ })
    expect(within(week).getByText(/Completada/)).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1')
  })
})

describe('diálogos', () => {
  it('Esc cierra el diálogo y no cuenta para la salida rápida de dos pulsaciones', async () => {
    const replace = vi.spyOn(exitApi, 'replace').mockImplementation(() => {})
    render(<App />)
    click('Necesito ayuda')
    const dialog = await screen.findByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(replace).not.toHaveBeenCalled()
  })

  it('la ayuda conserva "Salir rápido" dentro del diálogo', async () => {
    const replace = vi.spyOn(exitApi, 'replace').mockImplementation(() => {})
    render(<App />)
    click('Necesito ayuda')
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /Salir rápido/ }))
    expect(replace).toHaveBeenCalledWith('/neutral.html')
  })
})

describe('demo de "Conversar con Matilde" (simulada)', () => {
  beforeEach(() => {
    demoTiming.typingMs = 0
    demoTiming.blockMs = 0
  })

  const openChat = async () => {
    render(<App />)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    fireEvent.click(within(nav).getByRole('button', { name: 'Conversar con Matilde' }))
    await screen.findByRole('heading', { name: 'Prueba una conversación de ejemplo' })
  }

  it('avisa que es una demostración, sin IA y sin contenido validado, y no tiene texto libre', async () => {
    await openChat()
    expect(screen.getByText(/Demostración: las respuestas están escritas de antemano/)).toBeTruthy()
    expect(document.querySelectorAll('input, textarea').length).toBe(0)
    click('Docente')
    await screen.findByText('Soy docente.')
    expect(document.querySelectorAll('input, textarea').length).toBe(0)
  })

  it('docente: explica la menstruación citando lecciones con revisión simulada (no real)', async () => {
    await openChat()
    click('Docente')
    click('¿Cómo explico la menstruación a mis estudiantes?')
    await screen.findByText('Me baso en estas lecciones')
    expect(screen.getByText('Mitos y creencias que no ayudan')).toBeTruthy()
    expect(screen.getByText('Sanitaria')).toBeTruthy()
    expect(screen.getByText('Lingüística')).toBeTruthy()
    expect(screen.getByText('Protección infantil')).toBeTruthy()
    expect(screen.getByText('simulada')).toBeTruthy()
    expect(screen.getByText(/contenido de ejemplo, sin validar/)).toBeTruthy()
  })

  it('docente: ante una pregunta de medicamentos no improvisa y deriva a un establecimiento de salud', async () => {
    await openChat()
    click('Docente')
    click('Una estudiante tiene mucho dolor. ¿Qué medicina le puedo dar?')
    await screen.findByText(/no voy a improvisar/)
    expect(await screen.findByText('Derivación: establecimiento de salud')).toBeTruthy()
    expect(screen.queryAllByRole('link', { name: /Llamar al/ })).toHaveLength(0)
  })

  it('docente: ante una sospecha de abuso muestra la Línea 100 (castellano, quechua y aimara)', async () => {
    await openChat()
    click('Docente')
    click(/Una estudiante me contó que un adulto la hace sentir insegura/)
    const call = await screen.findByRole('link', { name: /Llamar al 100/ })
    expect(call.getAttribute('href')).toBe('tel:100')
    expect(call.textContent).toMatch(/Castellano, quechua y aimara/)
    expect(screen.getAllByText('Por confirmar').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Abrir la ruta/ })).toBeTruthy()
  })

  it('no guarda nada y salir rápido descarta la conversación', async () => {
    const replace = vi.spyOn(exitApi, 'replace').mockImplementation(() => {})
    await openChat()
    click('Docente')
    click('¿Cómo explico la menstruación a mis estudiantes?')
    await screen.findByText('Me baso en estas lecciones')
    expect(window.localStorage.getItem(PREFS_KEY)).toBeNull()
    click(/Salir rápido/)
    expect(demoRole.value).toBeNull()
    expect(replace).toHaveBeenCalledWith('/neutral.html')
  })

  it('permite cambiar de rol y reiniciar la demostración', async () => {
    await openChat()
    click('Docente')
    click('¿Cómo explico la menstruación a mis estudiantes?')
    await screen.findByText('Me baso en estas lecciones')
    click('Reiniciar demostración')
    await waitFor(() => expect(screen.queryByText('Me baso en estas lecciones')).toBeNull())
    click('Cambiar de rol')
    await screen.findByRole('button', { name: 'Personal de salud' })
  })
})
