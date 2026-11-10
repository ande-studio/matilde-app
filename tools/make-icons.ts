/**
 * Genera los íconos PNG de la PWA a partir de la mascota SVG.
 * Uso: npm run icons   (los PNG resultantes se versionan en public/)
 */
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const svg = await readFile(new URL('../public/matilde-flor.svg', import.meta.url))
const background = '#e7f0dd'

async function render(size: number, inner: number, out: string): Promise<void> {
  const mascot = await sharp(svg, { density: 384 })
    .resize({ width: inner, height: inner, fit: 'inside' })
    .png()
    .toBuffer()
  const png = await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mascot, gravity: 'center' }])
    .png()
    .toBuffer()
  await writeFile(new URL(`../public/${out}`, import.meta.url), png)
  console.log(`✓ ${out} (${size}×${size})`)
}

await render(192, 150, 'icon-192.png')
await render(512, 400, 'icon-512.png')
// Maskable: el motivo debe caber en la "zona segura" central (~80 %)
await render(512, 300, 'icon-maskable-512.png')
