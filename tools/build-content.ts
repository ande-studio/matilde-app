/**
 * Empaquetador de contenido.
 *
 *   npm run content                       → canal por defecto (review)
 *   CONTENT_CHANNEL=production npm run content
 *   npm run content -- --channel=draft
 *
 * Valida `content/` contra los esquemas, comprueba integridad y escribe
 * `src/generated/content.json` con lo que corresponde al canal.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { ContentError, buildContent, loadContentFiles } from './lib/content-build'
import { CHANNELS, isChannel } from '../schemas/gating'

const arg = process.argv.find((a) => a.startsWith('--channel='))?.split('=')[1]
const requested = arg ?? process.env.CONTENT_CHANNEL ?? 'review'
if (!isChannel(requested)) {
  console.error(`Canal desconocido "${requested}". Usa: ${CHANNELS.join(', ')}`)
  process.exit(1)
}

const contentDir = fileURLToPath(new URL('../content', import.meta.url))
const outDir = fileURLToPath(new URL('../src/generated', import.meta.url))

try {
  const files = await loadContentFiles(contentDir)
  const result = buildContent(files, requested)
  await mkdir(outDir, { recursive: true })
  await writeFile(`${outDir}/content.json`, JSON.stringify(result))
  const { stats, meta } = result
  console.log(
    `contenido [${meta.channel}] v${meta.version}: ${stats.included}/${stats.total} piezas incluidas, ` +
      `${stats.approvedLocales} idiomas aprobados, ${stats.pendingLocales} pendientes de revisión`,
  )
  const unapproved = result.pieces.filter(
    (p) => !p.alwaysAvailable && Object.values(p.review).some((r) => !r.approved),
  )
  if (meta.channel === 'production' && unapproved.length > 0) {
    console.error('Error: el canal production no puede incluir contenido sin aprobar.')
    process.exit(1)
  }
} catch (error) {
  if (error instanceof ContentError) {
    console.error(error.message)
    for (const p of error.problems) console.error(`  - ${p}`)
    process.exit(1)
  }
  throw error
}
