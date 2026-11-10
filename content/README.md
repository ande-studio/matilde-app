# Contenido

Cada archivo `.json` es una **pieza** con identificador estable. El esquema vive en `schemas/content.ts` y `npm run content` lo valida (también las referencias cruzadas).

| Carpeta | `kind` | Qué es |
| --- | --- | --- |
| `guias/` | `guide` | Guía rápida de consejería (qué decir, qué preguntar, cuándo derivar) |
| `formacion/` | `lesson` | Micro-lección con práctica opcional |
| `mostrar/` | `share` | Mensaje para ver **junto a la paciente** (Modo consulta); `ageBands` obligatorio |
| `frases/` | `phrases` | Frases en español con su propuesta en quechua (`qu: null` = pendiente) |
| `ayuda/` | `ayuda` | Números de emergencia del país (siempre disponibles) |
| `ruta/` | `ruta` | Árbol "¿Qué hago?": preguntas, reglas y salidas |

## Reglas

1. **Todo lleva derecho asociado** (`rights`) y, si existen, `sources`.
2. **Las revisiones se registran** en `reviews.es` / `reviews.qu`. Una revisión `approved` exige `by`, `date` y `version`. **No marques como aprobado algo que no lo está.**
3. **Quien edita no aprueba su propia revisión.**
4. Revisiones requeridas por tema (`schemas/gating.ts`, tabla del SDD v1.2):

   | Tema | Sanitaria | Lingüística | Comunitaria | Protección infantil | Legal |
   | --- | :-: | :-: | :-: | :-: | :-: |
   | `educacion_sexual` | ✔ | ✔ | ✔ | si es material para menores de 12 o para la paciente | – |
   | `abuso_violencia` | ✔ | ✔ | ✔ | ✔ | ✔ (regla estricta) |
   | `rutas_denuncia` | – | ✔ | ✔ | ✔ | ✔ |
   | `frases` (kind) | – | ✔ | ✔ | ✔ | – |

5. **No se inventan traducciones al quechua.** Si falta, `qu: null` y la app lo marca como pendiente.
6. Contenido de abuso y violencia: a nivel de patrones, sin descripciones explícitas ni ejemplos que sirvan de guion.
7. Un cambio de texto invalida la aprobación de esa versión: sube `version` al volver a revisarlo.
8. **Cambios en `ruta/`**: actualizan `tests/snapshots/ruta-combinaciones.txt` (`npx vitest run -u tests/ruta.test.ts`) y requieren revisión legal; completar `vigenciaLegal` y `responsableLegal`.

## Estado actual

Todas las piezas son **borrador**: ninguna revisión está aprobada. Los textos se adaptaron del prototipo (kit del 2026-11-09) y del SDD v1.2 sin añadir afirmaciones clínicas ni legales propias; lo pendiente está marcado en cada pieza.
