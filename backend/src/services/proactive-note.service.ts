import { AdaptedCv, ProactiveContext } from '../interfaces/cv.interface';

const text = (value: string | undefined): string => (value || '').trim();

/**
 * Nota breve para acompañar un CV espontáneo. Se arma en el servidor sin una
 * segunda llamada a IA: usa solo datos del CV generado y del contexto elegido,
 * para no inventar una oferta ni una respuesta de la organización.
 */
export const proactiveNoteService = {
    build(cv: AdaptedCv, context: ProactiveContext): string {
        const organization = text(context.organization);
        const sector = text(context.sector);
        const desiredRole = text(context.desiredRole);
        const ownNote = text(context.note);
        const name = text(cv.personalInfo.fullName) || '[tu nombre]';
        const focus = desiredRole
            ? `el rol de ${desiredRole}`
            : sector
                ? `el área de ${sector}`
                : 'una oportunidad acorde a mi perfil';

        const lines = [
            `Estimado equipo de ${organization}:`,
            '',
            `Mi nombre es ${name}. Les escribo para compartir mi CV de forma espontánea, con interés en sumarme a ${organization} en ${focus}.`
        ];

        const summary = text(cv.professionalSummary);
        if (summary) {
            lines.push('', summary);
        }

        if (ownNote) {
            lines.push('', `Además quiero destacar: ${ownNote}`);
        }

        lines.push('', 'Quedo a disposición para una entrevista. Muchas gracias por considerar mi postulación.', '');

        const contact = [
            text(cv.personalInfo.email),
            text(cv.personalInfo.phone),
            text(cv.personalInfo.linkedin)
        ].filter(Boolean);

        lines.push(contact.length ? `${name}\n${contact.join(' | ')}` : name);

        return lines.join('\n');
    }
};
