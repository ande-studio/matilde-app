# Matilde

PWA de apoyo a la consejería para **profesionales de postas médicas en Perú** que orientan a niñas y adolescentes. Funciona **sin conexión**, **sin cuentas** y **sin recoger datos de pacientes**.

> **Estado: Etapa 0 (MVP en PWA).** Todo el contenido es **borrador sin revisar** (sanitaria, lingüística, comunitaria, protección infantil y legal pendientes). No usar como guía clínica ni legal. La documentación de producto, alcance y decisiones está en el repositorio `matilde-knowledge-base`.

## Qué incluye la Etapa 0

| Función | Dónde |
| --- | --- |
| **Necesito ayuda** (Línea 100 y 105) a 2 toques desde cualquier pantalla, en un diálogo que no cambia la pantalla de fondo | `src/screens/Help.tsx` |
| **Salir rápido** a una pantalla neutra (`location.replace`, también con Esc dos veces) | `src/lib/exit.ts`, `public/neutral.html` |
| Ruta **"¿Qué hago?"**: árbol de decisión determinístico, solo opciones, sin guardar nada | `src/lib/ruta.ts`, `src/screens/Route.tsx` |
| **Guías rápidas** de consejería, filtradas por categoría y edad | `src/screens/Guides.tsx` |
| **Modo consulta**: mensaje a pantalla completa para ver con la paciente; volver exige mantener presionado | `src/screens/Share.tsx` |
| **Frases en quechua** (lo que falta se marca; no se inventa) | `src/screens/Phrases.tsx` |
| **Formación**: micro-lecciones con práctica y progreso opcional | `src/screens/Training.tsx` |
| **Conversar con Matilde**: pantalla de "próximamente" (sin IA, sin campo de texto) con accesos guiados | `src/screens/Matilde.tsx` |
| Inicio con ruta de aprendizaje, progreso y **racha semanal opcional y local** | `src/screens/Home.tsx`, `src/lib/week.ts` |
| Ajustes: idioma, edad, progreso opcional, **borrar todo** | `src/screens/Settings.tsx` |
| Offline (service worker), instalable | `vite.config.ts` |

**No incluye (a propósito):** IA, búsqueda de texto libre, cuentas, telemetría, audio, directorio local, app nativa, dashboard de edición. Ver el roadmap por etapas en la base de conocimiento.

## Empezar

Requiere Node ≥ 22.12 (`.nvmrc`).

```bash
npm install
npm run dev        # genera el contenido y abre Vite
npm test           # contenido, motor de la ruta, estado y UI
npm run typecheck
npm run build      # build + verificaciones de dist/
npm run preview    # sirve dist/ en local
```

El proyecto fija el registro público de npm (`.npmrc`) para que el lockfile no dependa de registros privados.

## Estructura

```
content/        Contenido fuente (JSON): guías, formación, mostrar, frases, ayuda, ruta
schemas/        Esquemas (Zod) del contenido y reglas de revisión por canal
tools/          Empaquetador de contenido, verificación de dist, generador de íconos
src/            App (Preact + TypeScript): pantallas, estado, i18n, motor de la ruta
public/         Íconos, pantalla neutra, cabeceras de seguridad (_headers)
tests/          Pruebas (Vitest + Testing Library)
```

## Contenido y canales de publicación

El contenido vive en `content/` como datos con **identificador estable**, **derecho asociado**, **fuentes** y **estado de revisión por idioma** (ver `content/README.md`). `npm run content` lo valida y genera `src/generated/content.json` según el canal:

| Canal | Qué incluye | Uso |
| --- | --- | --- |
| `draft` | Todo | Desarrollo |
| `review` (por defecto) | Todo salvo lo rechazado, con avisos de "sin revisar" | Piloto controlado |
| `production` | **Solo** idiomas con todas las revisiones requeridas aprobadas; los números de emergencia siempre viajan, marcados "por confirmar" | Público |

```bash
CONTENT_CHANNEL=production npm run content   # hoy solo incluye la ayuda de emergencia
```

Mientras nada esté aprobado, `production` solo lleva la ayuda de emergencia: es la garantía técnica de que **no se publica contenido sin validar**. La tabla de revisiones obligatorias sigue al SDD v1.2 (con regla estricta para abuso/violencia: también revisión legal).

## Invariantes de seguridad y privacidad (verificados en CI)

- Cero solicitudes a terceros: fuentes autoalojadas, CSP sin `unsafe-*`, sin scripts ni estilos en línea (`tools/check-build.ts`).
- Sin campos de texto en la ruta; sus respuestas viven solo en memoria (`tests/ui.test.tsx`).
- Solo se guarda idioma, edad (filtro) y, si se activa, el progreso (lecciones completadas y los días de la semana con una lección, hasta 14 días); **nada de pacientes ni consultas** (`tests/core.test.ts`).
- El enrutador no usa la URL ni el historial del navegador.
- Cualquier cambio en el árbol de la ruta cambia la tabla de combinaciones (`tests/snapshots/ruta-combinaciones.txt`) y exige revisión legal.
- Presupuesto: JS + CSS ≤ 150 KB gzip (hoy ≈ 31 KB).

## Despliegue (Cloudflare Pages)

| Ajuste | Valor |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Variable `NODE_VERSION` | `22` |
| Variable `CONTENT_CHANNEL` | `review` para el piloto (no publicar `production` sin contenido aprobado) |

`public/_headers` define la CSP y la caché. Mantener **desactivados** Web Analytics y cualquier script automático del proveedor (ADR-0006 de la base de conocimiento).

## Límites conocidos

- **Contenido**: borrador sin revisar. El quechua reutiliza solo propuestas del prototipo (sin revisión) y lo que falta se marca como pendiente.
- **Salir rápido** no borra el historial previo del navegador, no cierra la app instalada ni la quita de "recientes". La app lo dice en Ajustes.
- **Service worker / offline**: configurado y comprobado en el build (precache de la app y de la pantalla neutra), pero **no se verificó en un navegador real** con el modo avión. Falta una prueba E2E (Playwright) y una auditoría Lighthouse.
- **Interfaz**: sigue la identidad del prototipo HTML (barra lateral, encabezado con migas, tarjeta de bienvenida, ruta de aprendizaje, diálogos). Se ajustó el tamaño del texto (lectura ≥ 14 px, etiquetas ≥ 12 px) frente a los 8–11 px del prototipo, y los objetivos táctiles son ≥ 44 px.
- **Accesibilidad**: contraste revisado en los tokens; falta auditoría con lector de pantalla.
- **Sin directorio local** de servicios, sin audio, sin compartir la app sin internet, sin ícono discreto.
- **Dependencias**: `npm audit` reporta 6 avisos (2 bajos, 4 moderados) en la cadena de **build** (`workbox-build`); no se publican en la app. 0 avisos en dependencias de ejecución.
- La licencia del **contenido** está pendiente de definir.

## Licencia

Código bajo **Apache-2.0** (ver `LICENSE`). Licencia del contenido, ilustraciones y audios: pendiente.
