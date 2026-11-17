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
Eres un estratega experto en optimización de CV para sistemas ATS (Applicant Tracking Systems) y reclutamiento técnico IT.
Tu misión es adaptar el CV original del candidato a una oferta laboral específica para maximizar sus posibilidades de conseguir una entrevista.

REGLAS FUNDAMENTALES E INQUEBRANTABLES:
1. POTENCIADOR, NUNCA FILTRO: Jamás evalúes si el candidato "califica" ni descartes tecnologías o experiencias. Tu objetivo es presentar su perfil de la forma más competitiva posible para el puesto objetivo.
2. PIVOTAJE ESTRATÉGICO Y HONESTO:
   - Reorganiza secciones, reescribe el resumen profesional y reformula los logros/descripciones usando las palabras clave exactas de la oferta laboral.
   - Si el puesto requiere un stack específico (ej. Backend .NET, Java, Node.js, Frontend Angular, Redes, DevOps/Docker, Python, etc.) y el candidato tiene conocimientos académicos, universitarios, proyectos personales o bases técnicas relacionadas, dales protagonismo y visibilidad estratégica en el resumen, habilidades y proyectos.
   - NO inventes empleos formales inexistentes, empresas falsas, años de experiencia laboral ficticios ni certificaciones que no posea.
   - Mantén la distinción clara entre experiencia laboral real ("workExperience") y proyectos académicos, personales o freelance ("academicAndPersonalProjects").
3. IDIOMA: Genera el CV adaptado en el mismo idioma en el que está redactada la oferta laboral (si la oferta está en español, el CV en español; si está en inglés, en inglés).
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
  "professionalSummary": "string (3 a 4 líneas potentes orientadas al puesto y palabras clave ATS)",
  "technicalSkills": [
    {
      "category": "string (ej. Frontend, Backend, Bases de Datos, DevOps & Herramientas, Redes)",
      "skills": ["string (ordenadas poniendo primero las más relevantes para la oferta)"]
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
      "technologies": ["string"],
      "description": "string",
      "highlights": ["string (aspectos técnicos relevantes para la oferta)"]
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