<p align="center">
  <img src="front-ai-cv/public/logo.png" alt="CVOLVE" width="400" />
</p>

<h1 align="center">CVOLVE — tu CV, ajustado a la oferta que querés</h1>

<p align="center">
  <a href="https://github.com/ivovicencio/AI-powered-CV/actions/workflows/ci.yml"><img src="https://github.com/ivovicencio/AI-powered-CV/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/License-MIT-orange.svg" alt="Licencia MIT" />
  <img src="https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white" alt="Angular 21" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white" alt="Deploy en Vercel" />
  <img src="https://img.shields.io/badge/PWA-instalable-5A0FC8?logo=pwa&logoColor=white" alt="PWA instalable" />
</p>

<p align="center">
  <a href="https://cvolve-lime.vercel.app"><strong>Probar CVOLVE</strong></a>
  ·
  <a href="https://github.com/ivovicencio/AI-powered-CV/issues">Reportar un problema</a>
</p>

<p align="center">
  Subís tu CV, pegás una oferta (o extraés la descripción desde un link) y CVOLVE te devuelve un CV adaptado, listo para exportar en DOCX o PDF.
  <br />
  <strong>Sin registro. Sin base de datos. Sin guardar tus archivos. Open source.</strong>
</p>

<p align="center">
  Hecho por <a href="https://github.com/ivovicencio"><strong>Ivo Vicencio - ViroTech</strong></a>
</p>

---

## Tabla de contenidos

- [Qué resuelve](#qué-resuelve)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Cómo funciona](#cómo-funciona)
- [PWA: instalala en tu dispositivo](#pwa-instalala-en-tu-dispositivo)
- [Inicio rápido](#inicio-rápido)
- [Variables de entorno](#variables-de-entorno)
- [Uso](#uso)
- [API](#api)
- [Deploy en Vercel](#deploy-en-vercel)
- [Seguridad y control de coste](#seguridad-y-control-de-coste)
- [Límites conocidos y roadmap](#límites-conocidos-y-roadmap)
- [Tests y CI](#tests-y-ci)
- [Estructura del repo](#estructura-del-repo)
- [Contribuir](#contribuir)
- [Autor y redes](#autor-y-redes)
- [Licencia](#licencia)

## Qué resuelve

Adaptar un CV a cada oferta es repetitivo y fácil de hacer mal: se te escapan palabras clave, sobra experiencia irrelevante y terminás con tres versiones distintas del mismo archivo. CVOLVE automatiza ese ajuste con IA y te deja revisar el resultado antes de descargarlo. Está pensado para cualquier ocupación —incluidos perfiles de Economía, Finanzas y Contabilidad—: identifica las competencias que pide cada oferta, sin asumir que el puesto pertenece al rubro IT.

Está pensado para **uso público y abierto**: cualquiera que abra la URL puede usarlo, sin códigos ni invitaciones. El coste de la API se controla con límites, no con barreras de entrada.

## Funcionalidades

- **Extracción de ofertas:** pegás una URL pública y el backend prioriza datos estructurados de ofertas (JobPosting/JSON-LD), con lectura del contenido visible como alternativa. Si el sitio bloquea el acceso, podés pegar el texto manualmente.
- **Adaptación con IA para distintos sectores:** Groq identifica competencias, experiencia relevante y habilidades transferibles en el CV, y las relaciona con la oferta. Los términos ATS se usan de forma natural, sin inventar requisitos, experiencia ni logros.
- **Postulación espontánea:** elegí un rubro y después una empresa, multinacional u organismo público (o escribí el nombre de tu destino), subí tu CV y generá una versión orientada a ese destino junto con una nota editable para acompañar el envío. No hace falta que exista una oferta: **CVOLVE no envía ni guarda el CV**, el envío lo hacés vos.
- **Sugerencias directas:** escribís una idea y CVOLVE abre WhatsApp con el mensaje preparado; no se envía hasta que lo confirmes.
- **Revisión del resultado:** corregís el texto directamente en la vista previa, copiás en texto plano o descargás; los cambios se mantienen solo en la sesión actual.
- **Exportación:** DOCX y PDF generados en el servidor con `docx` y `pdfkit`.
- **Cero almacenamiento:** el archivo se procesa en memoria y se descarta; no hay base de datos ni subidas persistentes.
- **PWA instalable:** manifiesto, iconos propios, service worker, modo offline para la interfaz y botón _Instalar app_.
- **Listo para producción:** frontend y backend en un solo repo, desplegables en Vercel Services.
- **Open source de verdad:** licencia MIT, guía de contribución, código de conducta, política de seguridad, CI y smoke test.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21 (standalone + signals), Bootstrap 5, Bootstrap Icons, TypeScript 5.9 |
| PWA | `@angular/service-worker`, `ngsw-config.json`, `manifest.webmanifest` |
| Backend | Express 4 + TypeScript, multer, axios, cheerio, Groq SDK |
| Documentos | `pdf-parse`, `mammoth`, `docx`, `pdfkit` |
| Deploy | Vercel Services: front Angular estático + backend Express en container |
| Límites | Rate limit en memoria y cupo diario opcional en Upstash Redis |
| Calidad | Vitest + jsdom, GitHub Actions, `npm audit` |

## Cómo funciona

```text
Navegador
  └── Angular (frontend estático)
      └── /api/* → Express (backend/Dockerfile, Vercel Container Runtime)
          ├── /api/job/extract    → axios + cheerio → descripción de la oferta
          ├── /api/cv/adapt       → pdf-parse/mammoth → Groq → JSON AdaptedCv
          ├── /api/cv/proactive   → mismo pipeline + nota para envío espontáneo
          └── /api/cv/export/*    → docx / pdfkit → archivo para descargar
```

1. Subís un PDF/DOCX de hasta **4 MB** y pegás una descripción de al menos **20 caracteres**.
2. `POST /api/cv/adapt` extrae y normaliza el texto, lo envía a Groq con un prompt sectorialmente neutral que prohíbe inventar datos y devuelve el CV adaptado.
3. Revisás la vista previa y elegís copiar, descargar DOCX o descargar PDF.
4. El archivo desaparece: el buffer se limpia en memoria al terminar, tanto si salió bien como si falló.

> La clave de Groq vive **solo en el backend**. El bundle del navegador no contiene la key ni la URL de la API.

**Privacidad:** el texto extraído del CV y la oferta se envía a Groq para generar la adaptación. CVOLVE no guarda esos archivos ni el resultado en una base de datos; revisá las políticas de Groq antes de procesar información sensible.

## PWA: instalala en tu dispositivo

CVOLVE es una Progressive Web App. Una vez desplegada con HTTPS:

- **Chrome / Edge:** aparece un botón **Instalar app** en la cabecera cuando el navegador lo permite. También podés usar el menú *Instalar CVOLVE*.
- **Safari (iPhone/iPad):** *Compartir → Agregar a pantalla de inicio*.
- Se instala con nombre **CVOLVE**, icono propio y pantalla completa (`standalone`).
- La interfaz funciona sin conexión después de la primera carga: el service worker precarga HTML, CSS y JS, y guarda los assets bajo demanda.
- Las llamadas a `/api` **no se cachean**: nunca vas a ver un CV adaptado viejo ni a repetir una petición por culpa de la caché.
- Las actualizaciones de la app se aplican al cerrar las pestañas abiertas, comportamiento estándar de Angular Service Worker.

## Inicio rápido

Requisitos: **Node.js 22.12 o superior dentro de la rama 22, o Node.js 24+**, y una clave de [Groq](https://console.groq.com/). El proyecto se probó con Node.js 22 y 24.

```bash
git clone https://github.com/ivovicencio/AI-powered-CV.git
cd AI-powered-CV

npm run install:all
cp backend/.env.example backend/.env
# editá backend/.env y completá GROQ_API_KEY
```

En dos terminales:

```bash
npm run dev:backend   # http://localhost:3000
npm run dev:front     # http://localhost:4200
```

Abrí <http://localhost:4200>. El front llama siempre a `/api`; en local, `front-ai-cv/proxy.conf.json` redirige esas peticiones al puerto 3000. No hay CORS ni URLs hardcodeadas.

Verificación rápida:

```bash
curl http://localhost:4200/api/health
# {"status":"1","msg":"Backend AI-CV en TS funcionando correctamente"}
```

Para correr todas las verificaciones:

```bash
npm test           # 8 tests del front + smoke del rate limit
npm run build      # build de producción con service worker
```

## Variables de entorno

Se leen desde `backend/.env` en local y desde **Environment Variables** en Vercel.

| Variable | Obligatoria | Default | Para qué sirve |
|---|---|---|---|
| `GROQ_API_KEY` | Sí | — | Credencial de Groq. Nunca va al navegador. |
| `GROQ_MODEL` | No | `openai/gpt-oss-120b` | Modelo usado en la adaptación. |
| `RATE_LIMIT_MAX` | No | `10` | Solicitudes por IP y ventana. |
| `RATE_LIMIT_WINDOW_MS` | No | `3600000` | Duración de la ventana en milisegundos. |
| `DAILY_ADAPT_LIMIT` | No | `50` | Adaptaciones por día. |
| `UPSTASH_REDIS_REST_URL` | No | — | Hace que los contadores sean globales. |
| `UPSTASH_REDIS_REST_TOKEN` | No | — | Token REST de Upstash. |
| `CORS_ORIGIN` | No | refleja el origen | Origen permitido por CORS; normalmente no hace falta configurarla. |
| `PORT` | No | `3000` en local, `80` en Vercel | Puerto HTTP del backend; no hace falta definirlo como variable de proyecto. |

El modelo `llama-3.3-70b-versatile` fue retirado por Groq en 08/2026; no lo uses. Si querés abaratar cada llamada, probá `GROQ_MODEL=openai/gpt-oss-20b`.

## Uso

1. **Elegí el modo:** **Tengo una oferta** (flujo original) o **Elegí a quién enviarlo** (postulación espontánea).
2. **Subí tu CV:** arrastralo al área punteada o hacé clic para buscarlo (PDF o DOCX, máx. 4 MB).
3. **Contanos el destino:**
   - Con oferta: pegá la descripción o una URL pública y tocá **Extraer**. Si el sitio bloquea la lectura, podés copiar y pegar el texto igual.
   - Sin oferta: elegí un rubro, después una empresa, multinacional u organismo (o escribí el nombre) y, si querés, el rol que te interesa y un mensaje breve. El catálogo es orientativo: no indica vacantes ni contactos de RR.HH.
4. **Generá:** tocá **Adaptar mi CV** o **Generar CV para esta organización**.
5. **Revisá y llevátelo:** copiá el texto o descargá el DOCX/PDF desde el panel derecho. En el modo espontáneo también podés editar y copiar la nota; tenés que enviarla vos por el canal oficial de la organización.

## API

Todas las respuestas son JSON con `{ "status": "1", "data": ... }` cuando salen bien y `{ "status": "0", "msg": "..." }` cuando fallan.

| Método | Ruta | Body | Resultado |
|---|---|---|---|
| `GET` | `/api/health` | — | Estado del backend (público, no consume tokens) |
| `POST` | `/api/job/extract` | `{ "url": "..." }` | Descripción de la oferta |
| `POST` | `/api/cv/adapt` | `multipart/form-data`: `cvFile` + `jobDescription` | CV adaptado en JSON |
| `POST` | `/api/cv/proactive` | `multipart/form-data`: `cvFile` + `sector` + `organization` + `organizationKind` + `desiredRole` + `note` | `{ cv, note }` para envío espontáneo |
| `POST` | `/api/cv/export/docx` | `{ "cvData": {...} }` | Archivo DOCX |
| `POST` | `/api/cv/export/pdf` | `{ "cvData": {...} }` | Archivo PDF |

Ejemplos:

```bash
curl http://localhost:3000/api/health

curl -X POST http://localhost:3000/api/job/extract \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/oferta"}'

curl -X POST http://localhost:3000/api/cv/adapt \
  -F 'cvFile=@mi-cv.pdf' \
  -F 'jobDescription=Buscamos desarrollador frontend con Angular y TypeScript...'
```

| Código | Significado |
|---|---|
| `400` | Falta el archivo o el formato/tamaño no es válido. |
| `422` | No se pudo leer la URL de la oferta. |
| `429` | Superaste el límite por IP o el cupo diario. Incluye `Retry-After` cuando aplica. |
| `502` | El proveedor de IA falló o devolvió una respuesta inválida. |
| `503` | El proveedor de IA no está configurado, el modelo no está disponible o se alcanzó su cuota temporal. |
| `500` | Error inesperado; no expone stack traces. |

## Deploy en Vercel

1. Importá el repo en Vercel con **Root Directory: `.`** (raíz).
2. `vercel.json` define dos servicios en modo *Services*: `web` compila Angular y `api` ejecuta Express desde `backend/Dockerfile`.
3. Los rewrites públicos envían `/api/*` al servicio `api` y el resto al servicio `web`. Adentro de `web`, el rewrite SPA excluye rutas con extensión para no romper assets ni el service worker.
4. El servicio `api` usa el **Container Runtime** (`runtime: "container"`) y el Dockerfile compila TypeScript y ejecuta Express en `0.0.0.0:$PORT`.
5. Las dependencias **no se versionan**: los lockfiles sí. `.vercelignore` excluye dependencias, artefactos y `.env`; `backend/.dockerignore` excluye archivos locales del contexto Docker.
6. No hay *bindings*: el frontend es estático y llama a `/api` del mismo origen; no existe service-to-service.
7. Configurá `GROQ_API_KEY`. `GROQ_MODEL` es opcional; Upstash es recomendado para que los límites sean globales entre instancias. No configures `PORT` ni `CORS_ORIGIN` en Vercel.
8. Desplegá y verificá `https://<tu-dominio>/api/health`.

El Container Runtime de Vercel está en beta y tiene consumo según el uso. Revisá los límites y precios vigentes de Vercel y Groq antes de publicar tu propia instancia.

## Seguridad y control de coste

- **La key no sale del servidor.** El cliente Groq se crea de forma diferida y solo dentro del backend; el bundle nunca la contiene.
- **Sin cuentas, sin códigos.** Cualquiera puede usar la app; el control de gasto no depende de repartir secretos.
- **Límite por IP:** 10 solicitudes por hora por dirección (configurable). Devuelve `429` con `Retry-After`.
- **Cupo global:** 50 adaptaciones por día (configurable). Con Upstash Redis es global de verdad; sin esas variables, cada instancia del backend cuenta por su lado.
- **SSRF mitigado:** la extracción rechaza hosts privados y loopback, usa HTTPS cuando corresponde y tiene timeout de 10 s.
- **Upload acotado:** 4 MB en front y backend. Solo PDF/DOCX, procesados en memoria.
- **Cabeceras HTTP:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- **Sin secretos en el repo:** `.env` y los artefactos están ignorados por git y Vercel.
- **Dependencias auditadas:** `npm audit --omit=dev` sin vulnerabilidades altas al momento de este release.

Si el cupo se agota, la app sigue levantada y `/api/health` responde; solo se bloquean las adaptaciones hasta el día siguiente.

¿Encontraste un problema de seguridad? Seguí [SECURITY.md](SECURITY.md) y no abras un issue público.

## Límites conocidos y roadmap

Honestidad sobre lo que **todavía no está**:

- No hay cuentas ni cuotas por usuario: el límite es por IP y global, no por persona.
- Sin Upstash, los contadores son por instancia del contenedor.
- Cloudflare Turnstile (protección anti-bots sin pedir nada al usuario) está documentado pero no implementado.
- Los títulos de sección del documento se generan en español; el contenido se adapta al idioma de la oferta, pero esos encabezados quedan fijos.
- No hay almacenamiento: si cerrás la pestaña, perdés el resultado (podés descargarlo antes).
- El catálogo de la postulación espontánea es orientativo y está en el frontend: puede quedar desactualizado si una organización cambia de nombre. Siempre podés escribir el destino a mano.
- Próximos pasos naturales: Turnstile, cuotas por usuario, más formatos de entrada y tests e2e.

## Tests y CI

```bash
npm test           # front (Vitest) + smoke del rate limit
npm run test:front
npm run test:backend
npm run build
```

Los tests cubren la creación de componentes, la firma y las redes del footer, el prompt de instalación, la extracción estructurada de ofertas (incluido un perfil económico), la exportación DOCX/PDF, la validación del contrato de salida de IA y el comportamiento del rate limit (422 → 429 y cupo diario) sin consumir tokens ni usar Redis.

GitHub Actions ejecuta en cada push y PR: instalación con `npm ci`, type-check del backend, smoke del rate limit, tests del front y build de producción.

## Estructura del repo

```text
backend/
  Dockerfile              Imagen del servicio api en Vercel (Node 22)
  .dockerignore           Excluye .env, node_modules y dist del build
  src/server.ts           Entrypoint del container: listen() en 0.0.0.0:$PORT
  src/app.ts              Rutas, límites, cabeceras y errores
  src/index.ts            entrypoint local: exporta el app
  src/routes              /cv y /job
  src/controllers         Validación y orquestación
  src/services            Groq, extracción y generación DOCX/PDF
  src/middlewares         Rate limit y upload
  scripts/smoke-rate-limit.ts
front-ai-cv/
  public/                 Logo, favicons, iconos PWA, manifest y OG image
  src/app/components      Navbar, adapter, footer e install-prompt
  src/app/data            Catálogo de rubros y organizaciones del modo espontáneo
  src/app/services        CvService (siempre llama a /api)
  ngsw-config.json        Caché del service worker
  proxy.conf.json         /api → localhost:3000
vercel.json                    # Services: frontend Angular y API en contenedor
```

## Contribuir

¿Querés sumar algo? Lee [CONTRIBUTING.md](CONTRIBUTING.md) y [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Los cambios pasan por CI antes de merge. Si es una idea grande, abrí un issue primero para conversarla.

## Autor y redes

**Ivo Vicencio - ViroTech**

- [Instagram](https://www.instagram.com/ivothaiel/)
- [Facebook](https://www.facebook.com/ivothaiel.vicencio)
- [GitHub](https://github.com/ivovicencio)
- [LinkedIn](https://www.linkedin.com/in/ivo-vicencio-rosas-7aaa44211/)

Si CVOLVE te sirvió, una estrella al repo ayuda a que más personas lo encuentren.

## Licencia

[MIT](LICENSE) © 2026 Ivo Vicencio - ViroTech.
