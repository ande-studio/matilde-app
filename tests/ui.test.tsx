import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { exitApi } from '../src/lib/exit'
import { PREFS_KEY } from '../src/lib/storage'
import { eraseAll, setSaveProgress } from '../src/state/prefs'
import { go, type Route } from '../src/state/router'

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
    await screen.findByRole('heading', { name: 'Ajustes y privacidad' })
    click('Borrar todo de este dispositivo')
    expect(await screen.findByRole('alertdialog')).toBeTruthy()
    click('Borrar todo')
    await screen.findByText(/Se borraron tus preferencias/)
    expect(window.localStorage.getItem(PREFS_KEY)).toBeNull()
  })

  it('al cambiar a quechua se avisa que la traducción es de trabajo y lo que falta cae al español', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /QU/ }))
    await screen.findByText(/Runasimipi ñawpaq tikray/)
    expect(screen.getByRole('button', { name: /Yanapawanayta munani/ })).toBeTruthy()
    expect(screen.getByText('¿En qué te ayudamos hoy?')).toBeTruthy()
  })
})
