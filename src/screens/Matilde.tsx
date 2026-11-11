import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { Eyebrow, Icon, Mascot, ScreenTitle, type IconName } from '../components/ui'
import { getHelpLines } from '../content'
import {
  DEMO_ROLES,
  demoConfig,
  SIMULATED_REVIEWS,
  demoTiming,
  getPrompt,
  getRole,
  type DemoBlock,
  type DemoPromptId,
  type DemoRoleId,
} from '../demo/matilde'
import { locale, t, type MessageKey } from '../i18n'
import { demoRole, demoTurns, resetDemo } from '../state/session'
import { go, type Route } from '../state/router'
import { openHelp } from '../state/ui'

interface Choice {
  label: MessageKey
  icon: IconName
  to: Route
}

/** Atajos guiados (categorías y tarjetas), disponibles aunque no se use la demostración. */
const CHOICES: Choice[] = [
  { label: 'chat.c.route', icon: 'arrow', to: { name: 'route' } },
  { label: 'chat.c.guides', icon: 'arrow', to: { name: 'guides' } },
  { label: 'chat.c.training', icon: 'arrow', to: { name: 'training' } },
  { label: 'chat.c.phrases', icon: 'arrow', to: { name: 'phrases' } },
]

function Bubble({ who, children }: { who: 'you' | 'matilde'; children: ComponentChildren }) {
  return (
    <div class={`msg msg--${who}`}>
      <span class="visually-hidden">{t(who === 'you' ? 'demo.you' : 'demo.matilde')}: </span>
      <div class="msg-bubble">{children}</div>
    </div>
  )
}

function HelpBlock({ lineId }: { lineId: string }) {
  const line = getHelpLines().find((l) => l.id === lineId)
  if (!line) return null
  const text = line.locales[locale.value] ?? line.locales.es
  return (
    <div class="demo-help">
      <a class="help-call" href={`tel:${line.number}`}>
        <span>
          <b>{t('help.call', { number: line.number })}</b>
          <small>{text.label}</small>
          {text.detail && <small>{text.detail}</small>}
        </span>
        <Icon name="phone" />
      </a>
      <p class="help-verify">{line.verifiedAt ? t('help.verified', { date: line.verifiedAt }) : t('help.unverified')}</p>
      <div class="actions">
        <button type="button" class="btn btn--alert" onClick={() => go({ name: 'route' })}>
          <Icon name="shield" />
          {t('demo.help.route')}
        </button>
        <button type="button" class="btn btn--alert-quiet" onClick={openHelp}>
          <Icon name="heart" />
          {t('action.help')}
        </button>
      </div>
    </div>
  )
}

function Block({ block }: { block: DemoBlock }) {
  switch (block.type) {
    case 'p':
      return <p>{block.text}</p>
    case 'list':
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'sources':
      return (
        <div class="demo-sources">
          <p class="demo-sources__title">{t('demo.sources.title')}</p>
          <ul class="source-cards">
            {block.items.map((item) => (
              <li key={item.title}>
                <Icon name="book" />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.summary}</small>
                </span>
              </li>
            ))}
          </ul>
          <p class="demo-reviews">
            {demoConfig.showNotices && <span>{t('demo.sources.sim')}</span>}
            {SIMULATED_REVIEWS.map((r) => (
              <span class="badge badge--ok" key={r}>
                {r}
              </span>
            ))}
            {demoConfig.showNotices && <span class="badge badge--pending">{t('demo.sources.simTag')}</span>}
          </p>
        </div>
      )
    case 'refer':
      return (
        <div class="refer-card">
          <Icon name="heart" />
          <span>
            <strong>{block.title}</strong>
            <span>{block.text}</span>
          </span>
        </div>
      )
    case 'help':
      return <HelpBlock lineId={block.lineId} />
  }
}

/** Respuesta de Matilde: primero "escribe…", luego aparecen los bloques de a uno (simulación de una IA). */
function Answer({ role, id, done }: { role: DemoRoleId; id: DemoPromptId; done: boolean }) {
  const prompt = getPrompt(role, id)
  const total = prompt?.blocks.length ?? 0
  const [visible, setVisible] = useState(done ? total : -1) // -1 = escribiendo
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (done || !prompt) return
    let shown = 0
    let timer: number
    const tick = () => {
      shown += 1
      setVisible(shown)
      if (shown < total) timer = window.setTimeout(tick, demoTiming.blockMs)
      else demoTurns.value = demoTurns.value.map((turn) => (turn.prompt === id ? { ...turn, done: true } : turn))
    }
    timer = window.setTimeout(tick, demoTiming.typingMs)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'nearest' })
  }, [visible])

  if (!prompt) return null
  return (
    <Bubble who="matilde">
      {visible < 0 ? (
        <p class="typing" role="status">
          <span class="typing-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {t('demo.typing')}
        </p>
      ) : (
        <>
          {prompt.blocks.slice(0, visible).map((block, i) => (
            <Block block={block} key={i} />
          ))}
          {visible >= total && demoConfig.showNotices && <small class="demo-foot">{t('demo.foot')}</small>}
        </>
      )}
      <div ref={end} />
    </Bubble>
  )
}

function Demo() {
  const roleId = demoRole.value
  const role = roleId ? getRole(roleId) : null
  const turns = demoTurns.value
  const pending = turns.some((turn) => !turn.done)
  const remaining = role?.prompts.filter((p) => !turns.some((turn) => turn.prompt === p.id)) ?? []

  const chooseRole = (id: DemoRoleId) => {
    demoRole.value = id
    demoTurns.value = []
  }
  const ask = (id: DemoPromptId) => {
    if (pending) return
    demoTurns.value = [...turns, { prompt: id, done: false }]
  }

  return (
    <section class="demo" aria-labelledby="demo-title">
      <h2 id="demo-title" class={demoConfig.showNotices ? undefined : 'visually-hidden'}>
        {t('demo.title')}
      </h2>
      {demoConfig.showNotices && <p class="demo-banner">{t('demo.banner')}</p>}

      <div class="chat-log" role="log" aria-live="polite" aria-label={t('demo.log')}>
        <Bubble who="matilde">
          <p>{t('demo.roleQuestion')}</p>
        </Bubble>

        {role && (
          <>
            <Bubble who="you">
              <p>{role.said}</p>
            </Bubble>
            <Bubble who="matilde">
              <p>{role.greeting}</p>
            </Bubble>
            {turns.map((turn) => {
              const prompt = getPrompt(role.id, turn.prompt)
              if (!prompt) return null
              return (
                <div key={`${role.id}-${turn.prompt}`}>
                  <Bubble who="you">
                    <p>{prompt.question}</p>
                  </Bubble>
                  <Answer role={role.id} id={turn.prompt} done={turn.done} />
                </div>
              )
            })}
          </>
        )}
      </div>

      {!role && (
        <div class="choices" role="group" aria-label={t('demo.roleQuestion')}>
          {DEMO_ROLES.map((r) => (
            <button type="button" class="choice" key={r.id} onClick={() => chooseRole(r.id)}>
              {r.label}
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      )}

      {role && remaining.length > 0 && (
        <>
          <p class="chat-label">{t('demo.prompts.label')}</p>
          <div class="choices">
            {remaining.map((p) => (
              <button type="button" class="choice" key={p.id} disabled={pending} onClick={() => ask(p.id)}>
                {p.question}
                <Icon name="arrow" />
              </button>
            ))}
          </div>
        </>
      )}

      {role && remaining.length === 0 && !pending && <p class="muted">{t('demo.done')}</p>}

      {role && (
        <div class="actions">
          <button type="button" class="btn btn--quiet" onClick={() => (demoTurns.value = [])} disabled={turns.length === 0}>
            {t('demo.restart')}
          </button>
          <button type="button" class="btn btn--quiet" onClick={resetDemo}>
            {t('demo.changeRole')}
          </button>
        </div>
      )}
    </section>
  )
}

/**
 * "Conversar con Matilde": la conversación con IA llega después de validar el MVP.
 * Mientras tanto hay una DEMO simulada (preguntas sugeridas, respuestas escritas de antemano, sin texto libre).
 */
export function Matilde() {
  return (
    <div class="chat-wrap">
      <div class="chat-hero">
        <Mascot />
        <Eyebrow>{t('chat.eyebrow')}</Eyebrow>
        <ScreenTitle>{t('chat.title')}</ScreenTitle>
        <p>{t('chat.intro')}</p>
      </div>

      {demoConfig.showNotices && (
        <div class="chat-bubble">
          <span class="soon-tag">{t('soon.tag')}</span>
          <h2>{t('chat.soon.title')}</h2>
          <p>{t('chat.soon.body')}</p>
        </div>
      )}

      <Demo />

      <p class="chat-label">{t(demoConfig.showNotices ? 'chat.label' : 'chat.label.alt')}</p>
      <div class="choices">
        {CHOICES.map((choice) => (
          <button type="button" key={choice.label} class="choice" onClick={() => go(choice.to)}>
            {t(choice.label)}
            <Icon name={choice.icon} />
          </button>
        ))}
      </div>

      {demoConfig.showNotices && <p class="notice">{t('chat.notice')}</p>}
    </div>
  )
}
