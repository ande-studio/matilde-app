/**
 * Verificaciones sobre `dist/` (se ejecutan después de `vite build`):
 *  - cero referencias a terceros en HTML/CSS (fuentes, scripts, imágenes, iframes);
 *  - en JS solo URLs de enlaces permitidos (fuentes oficiales citadas por el contenido);
 *  - sin scripts ni estilos en línea (compatibles con la CSP estricta);
 *  - presupuesto de tamaño inicial (JS + CSS, gzip);
 *  - la pantalla neutra de "Salir rápido" y los íconos están precacheados.
 * Mantiene los invariantes de privacidad (ADR-0006) y de seguridad (SDD, constitución III y X.3).
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
/** Dominios permitidos en el JS: namespaces de SVG y enlaces oficiales que la persona puede abrir. */
const ALLOWED_HOSTS = ['www.w3.org', 'www.unicef.org', 'unicef.org', 'www.gob.pe', 'gob.pe', 'cdn.www.gob.pe', 'www.unfpa.org']
const BUDGET_GZIP_KB = 150

const problems: string[] = []
const fail = (msg: string) => problems.push(msg)

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])))
  return nested.flat()
}

const files = await walk(DIST)
const rel = (f: string) => f.slice(DIST.length + 1)
const urlPattern = /https?:\/\/([a-z0-9.-]+)/gi

let jsGzip = 0
let cssGzip = 0

for (const file of files) {
  const name = rel(file)
  const isHtml = name.endsWith('.html')
  const isCss = name.endsWith('.css')
  const isJs = name.endsWith('.js') && !name.startsWith('workbox-') && name !== 'sw.js'
  if (!isHtml && !isCss && !isJs) continue
  const text = await readFile(file, 'utf8')

  if (isJs) jsGzip += gzipSync(text).length
  if (isCss) cssGzip += gzipSync(text).length

  for (const match of text.matchAll(urlPattern)) {
    const host = match[1]!.toLowerCase()
    if (isJs) {
      if (!ALLOWED_HOSTS.some((h) => host === h)) fail(`${name}: referencia a un host no permitido (${host})`)
    } else {
      fail(`${name}: referencia externa en ${isCss ? 'CSS' : 'HTML'} (${host})`)
    }
  }

  if (isHtml) {
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(text)) fail(`${name}: contiene un <script> en línea (rompe la CSP)`)
    if (/<style[\s>]/i.test(text)) fail(`${name}: contiene un <style> en línea (rompe la CSP)`)
    if (/\sstyle=["']/i.test(text)) fail(`${name}: contiene un atributo style en línea (rompe la CSP)`)
  }
}

const totalKb = (jsGzip + cssGzip) / 1024
if (totalKb > BUDGET_GZIP_KB) fail(`presupuesto excedido: JS+CSS = ${totalKb.toFixed(1)} KB gzip (máximo ${BUDGET_GZIP_KB} KB)`)

const headers = await readFile(join(DIST, '_headers'), 'utf8').catch(() => '')
for (const needle of ["default-src 'self'", "connect-src 'self'", 'Referrer-Policy: no-referrer']) {
  if (!headers.includes(needle)) fail(`_headers: falta "${needle}"`)
}
if (/unsafe-inline|unsafe-eval/.test(headers)) fail('_headers: la CSP no debe permitir unsafe-inline ni unsafe-eval')

const sw = await readFile(join(DIST, 'sw.js'), 'utf8').catch(() => '')
for (const asset of ['neutral.html', 'neutral.css', 'index.html', 'icon-192.png']) {
  if (!sw.includes(asset)) fail(`sw.js: ${asset} no está en el precache`)
}

if (problems.length) {
  console.error(`\nVerificación del build: ${problems.length} problema${problems.length === 1 ? '' : 's'}`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}
console.log(
  `Verificación del build OK · JS ${(jsGzip / 1024).toFixed(1)} KB + CSS ${(cssGzip / 1024).toFixed(1)} KB (gzip, ` +
    `presupuesto ${BUDGET_GZIP_KB} KB) · sin terceros · CSP sin 'unsafe-*'`,
)
