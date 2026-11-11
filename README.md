# Matilde

**Matilde acompaña a las niñas y adolescentes en su desarrollo.** Esta es su primera versión: una app web instalable (PWA) para **profesionales de postas médicas en el Perú** que orientan a niñas y adolescentes en la consulta. Funciona **sin conexión**, **sin cuentas** y **sin recoger datos de pacientes**.

Es un proyecto social **de código abierto** (Apache-2.0), hecho por [Ande Studio](https://ande.studio).

> **Demo en vivo: https://matilde.ande.studio/**
>
> **Estado: Etapa 0 (MVP).** Todo el contenido es **borrador sin revisar** (sanitaria, lingüística, comunitaria, protección infantil y legal pendientes). No usar como guía clínica ni legal. Las respuestas de "Conversar con Matilde" son **de ejemplo, escritas de antemano**: no hay IA conectada.

## Contenido de este documento

1. [Qué es Matilde](#qué-es-matilde)
2. [Stack y arquitectura](#stack-y-arquitectura)
3. [El MVP (Etapa 0)](#el-mvp-etapa-0)
4. [Siguientes fases](#siguientes-fases)
5. [Modo de uso](#modo-de-uso)
6. [Ejecutar en localhost](#ejecutar-en-localhost)
7. [Contenido y canales de publicación](#contenido-y-canales-de-publicación)
8. [Seguridad y privacidad](#seguridad-y-privacidad)
9. [Despliegue](#despliegue)
10. [Límites conocidos](#límites-conocidos)
11. [Contribuir y licencia](#contribuir-y-licencia)

## Qué es Matilde

**El problema.** El personal de las postas médicas orienta a niñas y adolescentes sobre su cuerpo, la menstruación, los cuidados y la protección frente a la violencia, muchas veces con poco tiempo, sin conexión estable y a veces en quechua.

**La propuesta.** Una herramienta de apoyo, no un reemplazo del criterio profesional:

- **Guías rápidas** de lo que conviene decir, preguntar y cuándo derivar.
- **Material para mostrar a la paciente** en pantalla completa (Modo consulta).
- **Frases en quechua** para atender y conversar.
- **Ruta "¿Qué hago?"** ante sospecha de violencia y **"Necesito ayuda"** a dos toques desde cualquier pantalla.
- **Micro-lecciones** para el propio personal.

**Principios de diseño**

- **Seguridad primero:** pedir ayuda y salir rápido están siempre a la vista.
- **Nada sin validar:** el contenido se publica solo con las revisiones requeridas aprobadas (ver [canales](#contenido-y-canales-de-publicación)).
- **Privacidad por diseño:** sin cuentas, sin telemetría, sin texto libre, sin datos de pacientes.
- **Pensada para gama baja:** Android modesto, conexión intermitente, ≈ 42 KB de JS y CSS comprimidos.
- **Sin inventar traducciones:** si falta el quechua, se marca como pendiente.

> La documentación de producto, alcance, riesgos y decisiones (ADR) está en el repositorio `matilde-knowledge-base`.

## Stack y arquitectura

| Capa | Tecnología |
| --- | --- |
| Interfaz | [Preact](https://preactjs.com) 11 + [@preact/signals](https://preactjs.com/guide/v10/signals/) |
| Lenguaje | TypeScript 7 (estricto) |
| Build | [Vite](https://vite.dev) 8 |
| PWA / offline | `vite-plugin-pwa` 2 (Workbox, precache de toda la app) |
| Contenido | JSON validado con [Zod](https://zod.dev) 4 |
| Pruebas | Vitest 5 + Testing Library + happy-dom |
| Fuentes | DM Sans y Nunito, autoalojadas (licencia OFL) |
| Alojamiento | Cloudflare Pages (estático, sin backend) |
| CI | GitHub Actions: tipado, pruebas, build y verificaciones de `dist/` |

```
content/*.json ──► npm run content ──► src/generated/content.json ──┐
 (guías, lecciones,   valida con Zod,    (según el canal:            │
  frases, ayuda,      aplica revisiones   draft / review /           ▼
  ruta)               y canal)            production)        App Preact (SPA)
                                                                     │  vite build
                                                                     ▼
                                              dist/ + service worker (precache) ──► Cloudflare Pages
```

**Decisiones de arquitectura**

- **Sin backend, sin base de datos.** Todo es estático y el contenido viaja empaquetado: es lo más barato, rápido y fácil de operar con un equipo de dos personas.
- **Contenido como datos**, con identificador estable, derecho asociado, fuentes y estado de revisión por idioma. Editar contenido es editar un JSON en Git.
- **Enrutador en memoria:** la app no usa la URL ni el historial del navegador, para que lo consultado no quede en el historial.
- **Ruta "¿Qué hago?" determinística:** un árbol de decisión puro, probado con sus 400 combinaciones. No usa IA.
- **Navegación por categorías y tarjetas:** sin texto libre.
- **CSP estricta** (`public/_headers`): sin scripts ni estilos en línea, sin terceros.

**Estructura**

```
content/        Contenido fuente (JSON): guías, formación, mostrar, frases, ayuda, ruta
schemas/        Esquemas (Zod) del contenido y reglas de revisión por canal
tools/          Empaquetador de contenido, verificación de dist, íconos, visor móvil
src/            App: pantallas, componentes, estado, i18n, motor de la ruta, demo
public/         Íconos, pantalla neutra, cabeceras de seguridad (_headers)
tests/          Pruebas (Vitest + Testing Library)
```

## El MVP (Etapa 0)

| Función | Dónde |
| --- | --- |
| **Necesito ayuda** (Línea 100 y 105) a 2 toques desde cualquier pantalla, en un diálogo que no cambia la pantalla de fondo | `src/screens/Help.tsx` |
| **Salir rápido** a una pantalla neutra (`location.replace`, también con Esc dos veces) | `src/lib/exit.ts`, `public/neutral.html` |
| Ruta **"¿Qué hago?"**: árbol de decisión determinístico, solo opciones, sin guardar nada | `src/lib/ruta.ts`, `src/screens/Route.tsx` |
| **Guías rápidas** de consejería, filtradas por categoría y edad | `src/screens/Guides.tsx` |
| **Modo consulta**: mensaje a pantalla completa para ver con la paciente; volver exige mantener presionado | `src/screens/Share.tsx` |
| **Frases en quechua** (lo que falta se marca; no se inventa) | `src/screens/Phrases.tsx` |
| **Formación**: micro-lecciones con práctica y progreso opcional | `src/screens/Training.tsx` |
| **Conversar con Matilde**: demo **simulada** (elige rol, preguntas sugeridas, respuestas escritas de antemano; sin IA ni texto libre) | `src/screens/Matilde.tsx`, `src/demo/matilde.ts` |
| Inicio con ruta de aprendizaje, progreso y **racha semanal opcional y local** | `src/screens/Home.tsx`, `src/lib/week.ts` |
| Ajustes: idioma (español y quechua), edad, progreso opcional, **borrar todo** | `src/screens/Settings.tsx` |
| Offline (service worker) e instalable | `vite.config.ts` |

**No incluye (a propósito):** IA real, búsqueda de texto libre, cuentas, telemetría, audio, directorio local de servicios, app nativa y panel de edición de contenido.

## Siguientes fases

| Etapa | Qué entrega |
| --- | --- |
| **0 · PWA MVP** (actual) | Guías, Modo consulta, ruta "¿Qué hago?", Formación, offline, sin IA. **Falta lo crítico:** las revisiones de contenido (sanitaria, lingüística, comunitaria, protección infantil y legal) y las pruebas en dispositivos reales. |
| **1 · Búsqueda local, audio y panel** | Búsqueda local sin generar texto, audios en quechua y edición de contenido sin pasar por GitHub. |
| **2a · Validación de IA con un proveedor en la nube** | Evaluar con casos sintéticos, sin usuarios reales, contra los bancos de pruebas de seguridad. Un piloto supervisado requeriría aprobación expresa. |
| **2b · Modelo abierto y local** | Un modelo pequeño de pesos abiertos que corra en el teléfono, con apoyo en quechua. Solo después de validar con usuarios. La IA solo respondería desde contenido ya validado, citaría la lección de origen y derivaría a un centro de salud cuando nada lo respalde. Los casos de abuso seguirían en el árbol de decisión revisado legalmente, **nunca en la IA**. |
| **3 · Contenedor Android (opcional)** | APK de la PWA, compartir sin internet, ícono discreto. |
| **4 · Android nativo y multi-país** | Largo plazo. |

## Modo de uso

**Para quien atiende** (abre https://matilde.ande.studio/ en Chrome; en Android, menú ⋮ → **Instalar aplicación** para usarla sin conexión):

1. **Antes de la consulta:** revisa una **guía rápida** (qué decir, qué preguntar, cuándo derivar) o una **micro-lección** en *Explorar lecciones*.
2. **Con la paciente:** abre *Para mostrarle* y elige un mensaje. Se ve a pantalla completa y sin menús; para volver, **mantén presionado** el botón (es un gesto del profesional).
3. **En quechua:** usa *Frases* para atender y conversar; cambia el idioma de la interfaz desde el selector de arriba.
4. **Ante una sospecha de violencia:** abre **¿Qué hago?** y responde con opciones. Te dice qué hacer y a quién llamar. No guarda tus respuestas.
5. **Necesitas ayuda ya:** el botón **Necesito ayuda** siempre está a la vista. Muestra la Línea 100 y el 105.
6. **Privacidad:** **Salir rápido** (o `Esc` dos veces) lleva a una pantalla neutra. En *Mi perfil y ajustes* puedes **borrar todo** lo guardado en el dispositivo.

*Conversar con Matilde* es una demostración con preguntas sugeridas y respuestas de ejemplo.

## Ejecutar en localhost

Requiere **Node ≥ 22.12** (`.nvmrc` apunta a 22) y Git.

```bash
git clone https://github.com/ande-studio/matilde-app.git
cd matilde-app
nvm use            # opcional: usa la versión de .nvmrc
npm install
npm run dev
```

Si usas SSH: `git clone git@github.com:ande-studio/matilde-app.git`.

Abre la dirección que muestre Vite (normalmente **http://localhost:5173**). El modo desarrollo recarga solo y **no registra el service worker**.

Para ver la app como se despliega, incluido el modo sin conexión:

```bash
npm run build && npm run preview     # http://localhost:4173
```

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm test` | Pruebas: contenido, motor de la ruta, estado y UI |
| `npm run typecheck` | Tipado estricto |
| `npm run build` | Build + verificaciones de `dist/` (sin terceros, CSP, presupuesto) |
| `npm run content` | Valida y empaqueta el contenido para el canal actual |
| `npm run viewer` | Genera `artifact/matilde-viewer.html`: un visor móvil de un solo archivo |
| `npm run dev -- --host` | Expone el servidor en tu red para probar en un teléfono |

Pruebas útiles: `http://localhost:5173/?lang=qu` abre en quechua y `CONTENT_CHANNEL=production npm run dev` muestra solo lo aprobado (hoy, la ayuda de emergencia).

El proyecto fija el registro público de npm (`.npmrc`) para que el lockfile no dependa de registros privados.

## Contenido y canales de publicación

El contenido vive en `content/` como datos con **identificador estable**, **derecho asociado**, **fuentes** y **estado de revisión por idioma** (ver `content/README.md`). `npm run content` lo valida y genera `src/generated/content.json` según el canal:

| Canal | Qué incluye | Uso |
| --- | --- | --- |
| `draft` | Todo | Desarrollo |
| `review` (por defecto) | Todo salvo lo rechazado, con avisos de "sin revisar" | Piloto controlado |
| `production` | **Solo** idiomas con todas las revisiones requeridas aprobadas; los números de emergencia siempre viajan, marcados "por confirmar" | Público |

Mientras nada esté aprobado, `production` solo lleva la ayuda de emergencia: es la garantía técnica de que **no se publica contenido sin validar**. La tabla de revisiones obligatorias sigue al SDD v1.2, con regla estricta para abuso y violencia: también revisión legal.

## Seguridad y privacidad

Invariantes verificados en CI:

- Cero solicitudes a terceros: fuentes autoalojadas, CSP sin `unsafe-*`, sin scripts ni estilos en línea (`tools/check-build.ts`).
- Sin campos de texto en la ruta; sus respuestas viven solo en memoria (`tests/ui.test.tsx`).
- Solo se guarda idioma, edad (filtro) y, si se activa, el progreso: lecciones completadas y los días de la semana con una lección, hasta 14 días. **Nada de pacientes ni consultas** (`tests/core.test.ts`).
- El enrutador no usa la URL ni el historial del navegador.
- Cualquier cambio en el árbol de la ruta cambia la tabla de combinaciones (`tests/snapshots/ruta-combinaciones.txt`) y exige revisión legal.
- Presupuesto: JS + CSS ≤ 150 KB gzip (hoy ≈ 42 KB).

Para reportar una vulnerabilidad o contenido que pueda dañar, ver [`SECURITY.md`](SECURITY.md).

## Despliegue

Cloudflare Pages, conectado a este repositorio (rama de producción: `main`).

| Ajuste | Valor |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Variable `NODE_VERSION` | `22` |
| Variable `CONTENT_CHANNEL` | `review` para el piloto (no publicar `production` sin contenido aprobado) |

`public/_headers` define la CSP y la caché. Mantén **desactivados** Web Analytics y cualquier script automático del proveedor.

## Límites conocidos

- **Contenido:** borrador sin revisar. El quechua reutiliza solo propuestas del prototipo, también sin revisar, y lo que falta se marca como pendiente. Los números 100 y 105 siguen "por confirmar".
- **Demo de Matilde:** las respuestas son de ejemplo y **no están validadas**. Los avisos que lo indican están **ocultos temporalmente** (`demoConfig.showNotices` en `src/demo/matilde.ts`); no publiques esa pantalla así donde pueda tomarse por contenido validado. La marca de revisión que muestra es simulada. Solo los números de ayuda salen del contenido real. La conversación vive en memoria y "Salir rápido" o "Borrar todo" la descartan.
- **Sin conexión:** el service worker está configurado y el build lo verifica, pero **no se probó en un navegador real** en modo avión ni en teléfonos de gama baja. Falta una prueba E2E (Playwright) y una auditoría Lighthouse.
- **Salir rápido** no borra el historial previo del navegador, no cierra la app instalada ni la quita de "recientes". La app lo indica en Ajustes.
- **Accesibilidad:** texto de lectura ≥ 14 px, objetivos táctiles ≥ 44 px y contraste revisado en los tokens. Falta una auditoría con lector de pantalla.
- **Dependencias:** `npm audit` reporta avisos en la cadena de build (`workbox-build`); ninguno llega a la app publicada.
- La licencia del **contenido** está pendiente de definir.

## Contribuir y licencia

Lee [`CONTRIBUTING.md`](CONTRIBUTING.md) y [`content/README.md`](content/README.md): **la seguridad y la validación del contenido van primero**. Quien edita contenido no aprueba su propia revisión.

Código bajo **Apache-2.0** (ver [`LICENSE`](LICENSE)). Licencia del contenido, ilustraciones y audios: pendiente.
