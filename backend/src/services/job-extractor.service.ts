import axios from 'axios';
import * as cheerio from 'cheerio';

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 12000;
const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1']);

const isPrivateHost = (rawHostname: string): boolean => {
    const host = rawHostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (host.includes(':')) {
        return host === '::1' || host.startsWith('fe80') || host.startsWith('fc') || host.startsWith('fd');
    }

    return (
        BLOCKED_HOSTNAMES.has(host) ||
        host === '127.0.0.1' ||
        host.startsWith('127.') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        host.endsWith('.local') ||
        host.endsWith('.internal')
    );
};

const parsePublicUrl = (rawUrl: string): URL => {
    let parsed: URL;

    try {
        parsed = new URL(rawUrl.trim());
    } catch {
        throw new Error('La URL no es válida. Copiá y pegá la descripción manualmente.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Solo se admiten enlaces http o https. Copiá y pegá la descripción manualmente.');
    }

    if (isPrivateHost(parsed.hostname)) {
        throw new Error('No se puede leer esa dirección. Copiá y pegá la descripción manualmente.');
    }

    return parsed;
};

const cleanText = (text: string): string =>
    text
        .replace(/\u00a0/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .split(/\r?\n/)
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');

const htmlToText = (html: string): string => {
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, iframe, noscript, svg, form, button').remove();
    $('br').replaceWith('\n');
    $('p, li, h1, h2, h3, h4, h5, h6, section, article, div').each((_, element) => {
        $(element).append('\n');
    });
    return cleanText($.root().text());
};

const getObjectText = (value: unknown): string => {
    if (typeof value === 'string') {
        return htmlToText(value);
    }
    if (typeof value === 'number') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(getObjectText).filter(Boolean).join(', ');
    }
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return cleanText(
            [
                getObjectText(record.name),
                getObjectText(record.value),
                getObjectText(record.text),
                getObjectText(record.address),
                getObjectText(record.addressLocality),
                getObjectText(record.addressRegion),
                getObjectText(record.addressCountry)
            ]
                .filter(Boolean)
                .join(', ')
        );
    }
    return '';
};

const findJobPosting = (value: unknown): Record<string, unknown> | null => {
    if (Array.isArray(value)) {
        for (const item of value) {
            const posting = findJobPosting(item);
            if (posting) return posting;
        }
        return null;
    }
    if (!value || typeof value !== 'object') return null;

    const record = value as Record<string, unknown>;
    const types = Array.isArray(record['@type']) ? record['@type'] : [record['@type']];
    if (types.some(type => typeof type === 'string' && type.split(/[\/#]/).pop() === 'JobPosting')) {
        return record;
    }

    for (const nested of Object.values(record)) {
        const posting = findJobPosting(nested);
        if (posting) return posting;
    }
    return null;
};

const extractStructuredPosting = ($: cheerio.CheerioAPI): string => {
    for (const script of $('script[type="application/ld+json"]').toArray()) {
        const content = $(script).text();
        try {
            const posting = findJobPosting(JSON.parse(content));
            if (!posting) continue;

            const organization = getObjectText(posting.hiringOrganization);
            const location = getObjectText(posting.jobLocation);
            const sections = [
                getObjectText(posting.title) && `Puesto: ${getObjectText(posting.title)}`,
                organization && `Empresa: ${organization}`,
                location && `Ubicación: ${location}`,
                getObjectText(posting.description),
                getObjectText(posting.responsibilities) && `Responsabilidades: ${getObjectText(posting.responsibilities)}`,
                getObjectText(posting.qualifications) && `Requisitos: ${getObjectText(posting.qualifications)}`,
                getObjectText(posting.skills) && `Habilidades: ${getObjectText(posting.skills)}`,
                getObjectText(posting.experienceRequirements) && `Experiencia requerida: ${getObjectText(posting.experienceRequirements)}`,
                getObjectText(posting.educationRequirements) && `Formación requerida: ${getObjectText(posting.educationRequirements)}`,
                getObjectText(posting.employmentType) && `Tipo de empleo: ${getObjectText(posting.employmentType)}`
            ].filter(Boolean);
            const text = cleanText(sections.join('\n'));
            if (text.length >= 100) return text.slice(0, MAX_DESCRIPTION_LENGTH);
        } catch {
            // Una etiqueta JSON-LD malformada no debe impedir el fallback al contenido visible.
        }
    }
    return '';
};

const scoreCandidate = (text: string, priority: number): number => {
    const words = text.toLowerCase().match(/[a-záéíóúñü]+/g) || [];
    const relevantWords = words.filter(word =>
        /^(responsabilidades|responsabilidad|requisitos|requisito|calificaciones|experiencia|habilidades|competencias|perfil|funciones|requirements|qualifications|responsibilities|experience|skills|about)$/.test(word)
    ).length;
    const noiseWords = words.filter(word =>
        /^(inicio|ingresar|registro|privacidad|cookies|publicidad|home|login|sign|subscribe|newsletter|menu)$/.test(word)
    ).length;
    const relevance = words.length ? relevantWords / words.length : 0;
    return Math.min(text.length, 7000) + relevance * 5000 - noiseWords * 100 + priority;
};

export const extractJobDescriptionFromHtml = (html: string): string => {
    const $ = cheerio.load(html);
    const structuredText = extractStructuredPosting($);
    if (structuredText) return structuredText;

    $('script, style, nav, footer, header, iframe, noscript, svg, form, button, [aria-hidden="true"]').remove();

    const selectors = [
        '[itemprop="description"]',
        '[data-testid*="job-description" i]',
        '[class*="job-description" i]',
        '[id*="job-description" i]',
        '[class*="description" i]',
        'article',
        'main',
        'body'
    ];
    const candidates: { text: string; score: number }[] = [];

    selectors.forEach((selector, index) => {
        const element = $(selector).first();
        if (!element.length) return;
        const text = htmlToText(element.html() || '');
        if (text.length >= 100) {
            candidates.push({ text, score: scoreCandidate(text, (selectors.length - index) * 180) });
        }
    });

    const best = candidates.sort((a, b) => b.score - a.score)[0]?.text || '';
    if (best.length < 100) {
        throw new Error('No se encontró una descripción de oferta suficiente. Copiá y pegá el texto manualmente.');
    }

    return best.slice(0, MAX_DESCRIPTION_LENGTH);
};

export const jobExtractorService = {
    extractFromUrl: async (url: string): Promise<string> => {
        const target = parsePublicUrl(url);

        try {
            const response = await axios.get<string>(target.toString(), {
                timeout: 10000,
                maxContentLength: MAX_HTML_BYTES,
                maxBodyLength: MAX_HTML_BYTES,
                responseType: 'text',
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                    Accept: 'text/html,application/xhtml+xml'
                }
            });

            const header = response.headers['content-type'];
            const contentType = typeof header === 'string' ? header : '';
            if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
                throw new Error('El enlace no contiene una página HTML. Copiá y pegá la descripción manualmente.');
            }

            return extractJobDescriptionFromHtml(response.data);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                throw new Error('No se pudo acceder a la URL (sitio protegido o enlace inválido). Pegá la descripción manualmente.');
            }
            throw error;
        }
    }
};
