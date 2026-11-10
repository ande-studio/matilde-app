import { Icon, Mascot, ScreenTitle, Eyebrow, type IconName } from '../components/ui'
import { t, type MessageKey } from '../i18n'
import { go, type Route } from '../state/router'

interface Choice {
  label: MessageKey
  icon: IconName
  to: Route
}

/** Mientras no exista conversación (la IA no es parte de la Etapa 0), Matilde guía con categorías y tarjetas. */
const CHOICES: Choice[] = [
  { label: 'chat.c.route', icon: 'arrow', to: { name: 'route' } },
  { label: 'chat.c.guides', icon: 'arrow', to: { name: 'guides' } },
  { label: 'chat.c.training', icon: 'arrow', to: { name: 'training' } },
  { label: 'chat.c.phrases', icon: 'arrow', to: { name: 'phrases' } },
]

/** "Conversar con Matilde": pantalla de próximamente. No hay campo de texto, no hay IA y no se guarda nada. */
export function Matilde() {
  return (
    <div class="chat-wrap">
      <div class="chat-hero">
        <Mascot />
        <Eyebrow>{t('chat.eyebrow')}</Eyebrow>
        <ScreenTitle>{t('chat.title')}</ScreenTitle>
        <p>{t('chat.intro')}</p>
      </div>

      <div class="chat-bubble">
        <span class="soon-tag">{t('soon.tag')}</span>
        <h2>{t('chat.soon.title')}</h2>
        <p>{t('chat.soon.body')}</p>
      </div>

      <p class="chat-label">{t('chat.label')}</p>
      <div class="choices">
        {CHOICES.map((choice) => (
          <button type="button" key={choice.label} class="choice" onClick={() => go(choice.to)}>
            {t(choice.label)}
            <Icon name={choice.icon} />
          </button>
        ))}
      </div>

      <p class="notice">{t('chat.notice')}</p>
    </div>
  )
}
