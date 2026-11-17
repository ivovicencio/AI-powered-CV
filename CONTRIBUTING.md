# Contribuir a CVOLVE

Gracias por querer mejorar CVOLVE. Este documento explica cómo levantar el proyecto, cómo trabajar y qué se espera de un pull request.

## Antes de empezar

- Node.js 22.12 o superior dentro de la rama 22, o Node.js 24+, y npm.
- Una clave de [Groq](https://console.groq.com/). **Nunca la commitees.**

## Levantar el proyecto

```bash
git clone https://github.com/ivovicencio/AI-powered-CV.git
cd AI-powered-CV
npm run install:all
```

Copiá `backend/.env.example` a `backend/.env` y completá `GROQ_API_KEY`. En PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

En macOS/Linux:

```bash
cp backend/.env.example backend/.env
```

En dos terminales:

```bash
npm run dev:backend   # http://localhost:3000
npm run dev:front     # http://localhost:4200
```

El front llama a `/api` y el proxy de Angular redirige al backend. No hay URLs hardcodeadas.

## Verificaciones

```bash
npm run test           # tests del front + smoke del rate limit
npm run build          # build de producción del front
npm run build:backend  # type-check y build del backend
```

También podés correr `npm run test:front` y `npm run test:backend` por separado.

## Flujo de trabajo

CVOLVE usa un flujo liviano basado en pull requests; no mantiene una rama `develop`.

1. Creá una rama desde `main`: `feat/nombre-corto`, `fix/nombre-corto` o `docs/nombre-corto`.
2. Usá [Conventional Commits](https://www.conventionalcommits.org/), por ejemplo `feat: agregar exportación DOCX` o `fix: validar archivos PDF vacíos`.
3. Abrí un pull request pequeño y enfocado hacia `main`. La CI debe pasar antes del merge.
4. Los cambios se integran con *squash merge* para mantener clara la historia de `main`.

## Pull request

Antes de abrirlo, confirmá que:

- [ ] `npm run test` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm run build:backend` pasa.
- [ ] No hay secretos, `.env`, tokens ni rutas personales en el diff.
- [ ] Los textos de interfaz siguen en español.
- [ ] Si agregás una ruta al backend, la montás en `/ruta` **y** en `/api/ruta`.
- [ ] Si agregás comportamiento, sumás o actualizás un test.
- [ ] El README sigue siendo verdadero.

## Reportar un bug

Abrí un issue con: qué esperabas, qué pasó, pasos para reproducirlo, navegador/sistema y versión de Node. Si es un problema de seguridad, **no** abras un issue público: seguí `SECURITY.md`.

## Diseño y alcance

CVOLVE es un MVP deliberadamente chico: sin cuentas, sin base de datos y sin almacenamiento de archivos. Las peticiones que consumo tokens (IA y extracción) están limitadas por IP y por cupo diario. Si tu idea aumenta el coste por usuario, conversalo antes en un issue.

## Código de conducta

Participar implica aceptar el [Código de Conducta](CODE_OF_CONDUCT.md).
