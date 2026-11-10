import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import { render } from 'preact'
import { setupPwa } from './pwa'

function App() {
  return <h1>Matilde</h1>
}

render(<App />, document.getElementById('app')!)

setupPwa({
  onNeedRefresh: () => console.info('Hay una versión nueva disponible'),
  onOfflineReady: () => console.info('Listo para usar sin conexión'),
})
