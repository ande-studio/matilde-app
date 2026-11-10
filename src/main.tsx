import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import './styles/main.css'
import { render } from 'preact'
import { App } from './App'
import { applyDocumentLanguage, locale } from './i18n'
import { setupPwa } from './pwa'
import { applyUpdate, offlineReady, updateReady } from './state/pwa'

applyDocumentLanguage(locale.value)
render(<App />, document.getElementById('app')!)

applyUpdate.value = setupPwa({
  onNeedRefresh: () => (updateReady.value = true),
  onOfflineReady: () => (offlineReady.value = true),
})
