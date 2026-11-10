import type { AgeBand } from '../../schemas/content'
import type { AgeFilter } from '../state/prefs'

/** Una pieza sin bandas de edad aplica a todas; si tiene, debe incluir la elegida. */
export function matchesAge(bands: readonly AgeBand[], filter: AgeFilter): boolean {
  return filter === 'all' || bands.length === 0 || bands.includes(filter)
}
