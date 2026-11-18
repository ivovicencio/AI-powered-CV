import Groq from 'groq-sdk';
import { AdaptedCv } from '../interfaces/cv.interface';

// Modelo vigente en Groq. El anterior llama-3.3-70b-versatile fue retirado
// el 16/08/2026; se puede overridear con GROQ_MODEL en .env / Vercel.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

let groqClient: Groq | null = null;

// Cliente diferido: si falta la key, solo falla /cv/adapt y no el arranque
// completo de la app (importante para /api/health y para el deploy).
const getGroqClient = (): Groq => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || apiKey === 'tu_api_key_de_groq_aqui') {
        throw new Error('Falta configurar GROQ_API_KEY en el archivo .env del backend.');
    }

    if (!groqClient) {
        groqClient = new Groq({ apiKey });
    }

    return groqClient;
};

const SYSTEM_PROMPT = `
Eres especialista en selección de talento y optimización de CV para sistemas ATS de distintos sectores y ocupaciones.
Tu misión es adaptar el CV original del candidato a una oferta laboral específica, sea del rubro que sea, para comunicar con claridad la experiencia más relevante.

REGLAS FUNDAMENTALES E INQUEBRANTABLES:
1. POTENCIADOR, NUNCA FILTRO: No decidas si el candidato "califica" ni descartes experiencias por no ser idénticas a la oferta. Presenta lo más relevante con honestidad.
2. ADAPTACIÓN TRANSFERIBLE Y HONESTA:
   - Identifica primero la ocupación, el sector, las responsabilidades, las competencias y los requisitos de la oferta. No presupongas que se trata de un puesto de tecnología.
   - Reorganiza secciones y adapta el resumen, las habilidades y los logros para destacar experiencia y competencias relevantes, incluidas las transferibles entre sectores.
   - Usa términos clave de la oferta de forma natural solo cuando estén respaldados por el CV. No rellenes el documento con palabras clave ni afirmes conocimientos, licencias, certificaciones, herramientas, métricas o responsabilidades que no aparezcan en el CV.
   - No inventes empleos, empresas, fechas, años de experiencia ni resultados cuantificados. Conserva el sentido y el alcance de cada logro.
   - Separa claramente el empleo formal de proyectos académicos, personales o freelance. No conviertas una actividad, curso o habilidad en experiencia laboral.
   - Prioriza las habilidades que la oferta solicita y que sí están demostradas en el CV. Incluye habilidades analíticas, económicas, financieras, contables, operativas, comerciales, interpersonales, técnicas u otras según el perfil; no fuerces categorías irrelevantes.
   - Para perfiles de Economía, Finanzas o Contabilidad, destaca únicamente cuando estén respaldadas competencias como análisis económico o financiero, presupuestos, pronósticos, evaluación de riesgos, contabilidad, investigación, estadística o normativa. Mantén las diferencias entre conocimientos académicos, herramientas utilizadas y experiencia profesional.
   - Si falta un requisito importante en el CV, omítelo en vez de atribuírselo al candidato.
3. IDIOMA: Genera el contenido en el mismo idioma de la oferta laboral.
4. FORMATO DE SALIDA: Responde ÚNICAMENTE con un objeto JSON válido que respete exactamente la estructura solicitada, sin texto adicional, sin markdown ni explicaciones.

ESTRUCTURA JSON OBLIGATORIA:
{
  "personalInfo": {
    "fullName": "string",
    "targetRoleTitle": "string (título profesional adaptado exactamente al rol de la oferta)",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "professionalSummary": "string (resumen conciso orientado al puesto, con términos ATS relevantes y respaldados por el CV)",
  "keySkills": [
    {
      "category": "string (categoría natural para el perfil y sector, por ejemplo Economía y finanzas, Contabilidad, Análisis, Atención al cliente, Gestión, Ventas u Operaciones)",
      "skills": ["string (solo competencias respaldadas por el CV, ordenadas por relevancia para la oferta)"]
    }
  ],
  "workExperience": [
    {
      "role": "string",
      "company": "string",
      "period": "string",
      "location": "string",
      "achievements": ["string (viñetas orientadas a impacto y terminología de la oferta)"]
    }
  ],
  "academicAndPersonalProjects": [
    {
      "name": "string",
      "type": "Académico | Personal | Freelance",
      "toolsAndMethods": ["string (herramientas, métodos o enfoques realmente utilizados; lista vacía si no aplica)"],
      "description": "string",
      "highlights": ["string (aspectos del proyecto relevantes para la oferta)"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "period": "string",
      "status": "string"
    }
  ],
  "certificationsAndCourses": ["string"],
  "languages": ["string"]
}
`;

export const aiService = {
    adaptCvContent: async (rawCvText: string, jobDescription: string): Promise<AdaptedCv> => {
        const groq = getGroqClient();

        const userPrompt = `
=== OFERTA LABORAL OBJETIVO ===
${jobDescription}

=== CV ORIGINAL DEL CANDIDATO ===
${rawCvText}

Genera el JSON del CV adaptado siguiendo estrictamente todas las reglas y la estructura definida.
`;

        let content: string | null | undefined;

        try {
            const completion = await groq.chat.completions.create({
                model: GROQ_MODEL,
                temperature: 0.35,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt }
                ]
            });

            content = completion.choices[0]?.message?.content;
        } catch (error: unknown) {
            const status = (error as { status?: number }).status;

            if (status === 404) {
                throw new Error(
                    `El modelo "${GROQ_MODEL}" no está disponible en tu cuenta de Groq. ` +
                    'Configurá GROQ_MODEL con un modelo vigente (por ejemplo openai/gpt-oss-120b).'
                );
            }
            if (status === 401) {
                throw new Error('La API key de Groq no es válida. Revisá GROQ_API_KEY.');
            }
            if (status === 429) {
                throw new Error('Se alcanzó el límite de solicitudes de Groq. Esperá un momento y volvé a intentar.');
            }
            throw error;
        }

        if (!content) {
            throw new Error('La IA no devolvió respuesta. Intentá nuevamente.');
        }

        try {
            const parsed = JSON.parse(content) as AdaptedCv;
            return parsed;
        } catch (_err) {
            throw new Error('La respuesta de la IA no tuvo un formato JSON válido.');
        }
    }
};