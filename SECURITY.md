# Política de seguridad

## Versiones con soporte

Solamente la rama `main` recibe correcciones de seguridad.

## Cómo reportar una vulnerabilidad

**No abras un issue público.** Si encontraste un problema de seguridad:

1. Usá *Report a vulnerability* en la pestaña **Security** del repo, o
2. Escribile a Ivo Vicencio por [LinkedIn](https://www.linkedin.com/in/ivo-vicencio-rosas-7aaa44211/).

Incluí el impacto concreto, los pasos para reproducirlo y, si podés, una prueba de concepto mínima. Te pedimos que no pruebes contra el sitio desplegado con tráfico real ni que agotes la cuota de la API.

## Qué entra en alcance

- Filtrado de la clave de Groq al navegador, logs o artefactos públicos.
- Evasión del rate limiting o del cupo diario.
- SSRF en la extracción de URLs, path traversal o subida de archivos no permitidos.
- Inyección en la generación de DOCX/PDF o en el contenido devuelto al navegador.
- Dependencias con vulnerabilidades explotables.

## Qué no entra en alcance

- El coste de la API por uso normal: está gobernado por los límites documentados en el README, no es una vulnerabilidad.
- Ataques de denegación de servicio masivos: el rate limit los mitiga, pero no son reportables como fallo de seguridad.
- Reportes sin un impacto demostrable o consejos genéricos de hardening.

## Respuesta

Confirmamos la recepción, investigamos y aplicamos el arreglo en `main`. Si el reporte se acepta, lo acreditamos en el changelog salvo que prefieras permanecer anónimo.
