import assert from 'node:assert/strict';
import { extractJobDescriptionFromHtml } from '../src/services/job-extractor.service';

const structuredOffer = `
<html><body>
  <nav>Inicio Empleos Ingresar Crear cuenta</nav>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [{
        "@type": "https://schema.org/JobPosting",
        "title": "Analista económico-financiera",
        "hiringOrganization": { "@type": "Organization", "name": "Estudio del Sur" },
        "jobLocation": {
          "@type": "Place",
          "address": { "@type": "PostalAddress", "addressLocality": "Neuquén" }
        },
        "description": "<p>Buscamos una persona para analizar indicadores económicos y preparar informes de gestión.</p>",
        "responsibilities": ["Elaborar pronósticos financieros", "Analizar presupuestos"],
        "qualifications": ["Formación en Economía o Finanzas", "Conocimientos de estadística"]
      }]
    }
  </script>
  <main>Contenido genérico de la página de empleos.</main>
</body></html>`;

const structuredText = extractJobDescriptionFromHtml(structuredOffer);
assert.match(structuredText, /Analista económico-financiera/);
assert.match(structuredText, /Estudio del Sur/);
assert.match(structuredText, /Neuquén/);
assert.match(structuredText, /pronósticos financieros/);
assert.match(structuredText, /Economía o Finanzas/);
assert.doesNotMatch(structuredText, /Inicio Empleos/);

const visibleOffer = `
<html><body>
  <nav>Inicio Registro Newsletter ${'Navegar por el sitio. '.repeat(30)}</nav>
  <div class="job-description">
    <h1>Asistente administrativo</h1>
    <p>Responsabilidades: organizar documentación, coordinar agendas y dar seguimiento a consultas de clientes.</p>
    <p>Requisitos: experiencia en tareas administrativas, comunicación clara y manejo de herramientas de oficina.</p>
  </div>
  <footer>Privacidad Cookies</footer>
</body></html>`;

const visibleText = extractJobDescriptionFromHtml(visibleOffer);
assert.match(visibleText, /Asistente administrativo/);
assert.match(visibleText, /organizar documentación/);
assert.doesNotMatch(visibleText, /Newsletter/);

assert.throws(
    () => extractJobDescriptionFromHtml('<html><body><p>Sin una oferta de trabajo.</p></body></html>'),
    /descripción de oferta suficiente/
);

console.log('Extracción de ofertas: casos JSON-LD, contenido visible y texto insuficiente OK.');
