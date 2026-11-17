import axios from 'axios';
import * as cheerio from 'cheerio';

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1']);

const isPrivateHost = (rawHostname: string): boolean => {
    const host = rawHostname.toLowerCase().replace(/^\[|\]$/g, '');

    // IPv6: loopback, link-local y unique-local
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

export const jobExtractorService = {
    extractFromUrl: async (url: string): Promise<string> => {
        const target = parsePublicUrl(url);

        try {
            const response = await axios.get<string>(target.toString(), {
                timeout: 10000,
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
                }
            });

            const $ = cheerio.load(response.data);

            // Eliminar ruido innecesario
            $('script, style, nav, footer, header, iframe, noscript, svg').remove();

            // Priorizar contenedores habituales de ofertas laborales
            const selectors = [
                'article',
                'main',
                '[class*="job-description"]',
                '[class*="description"]',
                '[id*="job"]',
                '.content',
                'body'
            ];

            let rawText = '';
            for (const selector of selectors) {
                const candidate = $(selector).first().text().trim();
                if (candidate.length > 250) {
                    rawText = candidate;
                    break;
                }
            }

            const cleanedText = rawText
                .replace(/\s+/g, ' ')
                .trim();

            if (cleanedText.length < 100) {
                throw new Error('La página bloqueó la lectura automática o requiere inicio de sesión. Copiá y pegá la descripción manualmente.');
            }

            // Limitar tamaño máximo para no exceder tokens
            return cleanedText.slice(0, 8000);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                throw new Error('No se pudo acceder a la URL (sitio protegido o enlace inválido). Pegá la descripción manualmente.');
            }
            throw error;
        }
    }
};
