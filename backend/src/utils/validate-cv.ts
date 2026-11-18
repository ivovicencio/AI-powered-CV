import { AdaptedCv } from '../interfaces/cv.interface';

/**
 * Validación mínima del payload antes de generar DOCX/PDF.
 * Evita que un `cvData` malformado termine en un 500 genérico.
 */
export const isAdaptedCv = (value: unknown): value is AdaptedCv => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const cv = value as Record<string, unknown>;
    const personalInfo = cv.personalInfo as Record<string, unknown> | undefined;

    return (
        !!personalInfo &&
        typeof personalInfo.fullName === 'string' &&
        typeof personalInfo.targetRoleTitle === 'string' &&
        typeof cv.professionalSummary === 'string' &&
        Array.isArray(cv.keySkills) &&
        Array.isArray(cv.workExperience) &&
        Array.isArray(cv.academicAndPersonalProjects) &&
        Array.isArray(cv.education)
    );
};
