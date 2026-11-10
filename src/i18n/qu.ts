import type { MessageKey } from './es'

/**
 * Quechua sureño (Cusco-Collao): SOLO propuestas que ya existían en el kit del prototipo
 * (2026-11-09). No se añadió ni se corrigió ninguna traducción. Todo está pendiente de
 * revisión lingüística y comunitaria; lo que falta cae al español.
 * Ver la matriz de revisiones en matilde-knowledge-base (05).
 */
export const qu: Partial<Record<MessageKey, string>> = {
  'app.tagline': 'Kuskanchanapaq yachasun',
  'action.help': 'Yanapawanayta munani',
  'action.exit': 'Utqaylla lluqsiy',
  'action.close': 'Wichq’ay',
  'language.es': 'Castellano',
  'banner.qu': 'Runasimipi ñawpaq tikray. Simipi, ayllupi manaraq qhawarisqachu.',
  'help.title': 'Yanapawanayta munani',
  'help.intro':
    'Kunan peligro kaptinqa, amachakusqa kitita maskay, 105 yupayman waqyay. Sarunchakuymanta yanapaypaq Línea 100 nisqaman waqyayta atinki.',
  'help.noSignal': 'Waqyanapaqqa teléfono señal kanan.',
  'lesson.practice': 'Huk yachayta ruray',
  'lesson.complete': 'Yachayta tukuy',
  'settings.progress': 'Ñawpaqman risqayta kay dispositivopi waqaychay',
  'settings.erase': 'Kay dispositivomanta llapanta pichay',
  'settings.erase.title': '¿Kay dispositivomanta llapanta pichay?',
  'settings.erase.confirm': 'Llapanta pichay',
  'settings.erase.cancel': 'Waqaychay',
}
