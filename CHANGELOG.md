# Changelog

Todos los cambios relevantes se documentan acá. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [SemVer](https://semver.org/lang/es/).

## [0.2.0] - 2026-11-18

### Added

- Modo **postulación espontánea**: elegir un rubro y luego una empresa, multinacional u organismo público (o escribir un nombre propio), generar un CV adaptado a ese destino sin oferta publicada y acompañarlo con una nota editable.
- Catálogo orientativo de organizaciones argentinas con sitios institucionales verificados; no representa vacantes ni contactos de reclutamiento.
- `POST /api/cv/proactive` con el mismo control de límites y contrato de salida que `/api/cv/adapt`; la nota se arma en el servidor sin una segunda llamada a IA.

### Notas

- CVOLVE no envía el CV ni la nota: el usuario decide cuándo y por dónde enviarlos.

[0.2.0]: https://github.com/ivovicencio/AI-powered-CV/compare/v0.1.0...v0.2.0

## [0.1.0] - 2026-11-17

### Added

- Adaptación de CV (PDF/DOCX) a una oferta laboral con Groq, con vista previa y exportación DOCX/PDF.
- Extracción de descripción de ofertas desde URL pública, con bloqueo de hosts privados (SSRF).
- Procesamiento íntegramente en memoria: sin base de datos ni archivos persistidos.
- PWA instalable con manifiesto, iconos CVOLVE, service worker, caché offline y botón *Instalar app*.
- Rate limiting por IP y cupo diario global opcional mediante Upstash Redis.
- Cabeceras de seguridad HTTP y documentación de seguridad, contribución y código de conducta.
- CI en GitHub Actions: type-check del backend, tests del front, smoke del rate limit y build de producción.
- Firma **Hecho por Ivo Vicencio - ViroTech** y redes sociales en el pie de página.

[0.1.0]: https://github.com/ivovicencio/AI-powered-CV/releases/tag/v0.1.0
