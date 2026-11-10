# Cómo contribuir

Gracias por ayudar. Este proyecto trata con niñas y adolescentes: la **seguridad y la validación del contenido** van primero.

## Flujo

1. Abre una rama desde `main` y un Pull Request con la plantilla.
2. `npm test` y `npm run build` deben pasar (el CI los ejecuta).
3. Commits pequeños y descriptivos (`feat:`, `fix:`, `docs:`, `test:`, `build:`, `ci:`, `chore:`).

## Código

- TypeScript estricto; sin dependencias nuevas sin justificarlas (cada una es superficie de ataque y peso).
- **Nunca** añadir solicitudes a terceros (fuentes, analytics, CDN, mapas, iframes). `npm run build` lo bloquea.
- No guardar nada del usuario salvo lo que ya existe (idioma, edad, progreso opcional). **Nada de pacientes ni consultas.**
- No usar la URL ni el historial para navegar (el enrutador es en memoria a propósito).
- Texto de interfaz por clave en `src/i18n`; no traduzcas el DOM.

## Contenido

Lee `content/README.md`. Resumen: identificador estable, derecho asociado, fuentes, revisiones registradas, **quien edita no aprueba**, y no se inventan traducciones.

## Seguridad

Ver `SECURITY.md`. Si encuentras contenido que pueda dañar a una niña o a una persona usuaria, repórtalo como tema sensible antes de publicarlo.
