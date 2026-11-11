/**
 * Genera `artifact/matilde-viewer.html`: un visor móvil (marco de teléfono) con la app COMPLETA incrustada en un solo archivo.
 *
 * Por qué: una página de artifact de Claude no puede incrustar otros sitios (ni `localhost` ni `*.pages.dev`), así que la app
 * viaja dentro del propio archivo: JS, CSS, fuentes (woff2) e imágenes como `data:`. Sin red, sin terceros.
 * El visor solo carga fuentes de Google Fonts, que el artifact sí permite; la app usa las suyas incrustadas.
 *
 * Uso: `npm run viewer` (hace el build y luego este script).
 */
import { execSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const DIST = resolve('dist')
const OUT = resolve('artifact')

const read = (file: string) => readFile(join(DIST, file), 'utf8')
const dataUri = async (file: string, mime: string) =>
  `data:${mime};base64,${(await readFile(join(DIST, file))).toString('base64')}`

const index = await read('index.html')
const jsPath = /<script type="module"[^>]*src="\/([^"]+)"/.exec(index)?.[1]
const cssPath = /<link rel="stylesheet"[^>]*href="\/([^"]+)"/.exec(index)?.[1]
if (!jsPath || !cssPath) throw new Error('No se encontró el JS o el CSS en dist/index.html. ¿Corriste el build?')

// CSS: solo woff2 (todos los navegadores actuales) y como data URI
let css = await read(cssPath)
const fonts = [...css.matchAll(/url\((\/assets\/[^)]+\.woff2)\)format\("woff2"\)(?:,url\(\/assets\/[^)]+\.woff\)format\("woff"\))?/g)]
for (const match of fonts) {
  const uri = await dataUri(match[1]!.slice(1), 'font/woff2')
  css = css.replace(match[0], `url(${uri})format("woff2")`)
}
if (/url\(\/assets\//.test(css)) throw new Error('Quedaron referencias a /assets/ en el CSS')

// JS: la flor y cualquier otra imagen que la app cargue por ruta absoluta
let js = await read(jsPath)
js = js.split('`/matilde-flor.svg`').join('`' + (await dataUri('matilde-flor.svg', 'image/svg+xml')) + '`')
if (/["'`]\/(?:matilde-flor|favicon|icon-)[^"'`]*["'`]/.test(js)) throw new Error('Quedaron imágenes por ruta absoluta en el JS')
js = js.replace(/<\/script/gi, '<\\/script')

// Pantalla neutra de "Salir rápido": se escribe en el documento (no hay a dónde navegar)
const neutralCss = await read('neutral.css')
const neutralHtml = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Un momento</title><style>${neutralCss}</style></head><body><main><h1>Un momento de calma</h1><p>Respira. Tómate tu tiempo.</p><button class="back" id="b" type="button">Volver al inicio</button></main><script>document.getElementById('b').onclick=function(){parent.postMessage({matilde:'restart'},'*')}</script></body></html>`

const appHtml = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Matilde</title><style>${css}</style></head><body><div id="app"></div><script>window.__MATILDE_EMBED__=${JSON.stringify({ neutralHtml }).replace(/</g, '\\u003c')}</script><script type="module">${js}</script></body></html>`

const sh = (cmd: string) => {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}
const commit = sh('git rev-parse --short HEAD') || 'sin git'
const date = new Date().toISOString().slice(0, 10)

const template = await readFile(resolve('tools/viewer-template.html'), 'utf8')
const page = template
  .replace('__BUILD_INFO__', `${commit}, ${date}`)
  .replace('__APP_HTML_JSON__', () => JSON.stringify(appHtml).replace(/</g, '\\u003c').replace(/[\u0080-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')))

await mkdir(OUT, { recursive: true })
await writeFile(join(OUT, 'matilde-viewer.html'), page)
console.log(`artifact/matilde-viewer.html · ${(page.length / 1024).toFixed(0)} KB · ${commit} ${date}`)
