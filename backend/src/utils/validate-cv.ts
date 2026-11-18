import { AdaptedCv } from '../interfaces/cv.interface';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === 'string');

const isOptionalString = (value: unknown): boolean =>
    value === undefined || typeof value === 'string';

const isKeySkill = (value: unknown): boolean =>
    isRecord(value) &&
    typeof value.category === 'string' &&
    isStringArray(value.skills);

const isWorkExperience = (value: unknown): boolean =>
    isRecord(value) &&
    typeof value.role === 'string' &&
    typeof value.company === 'string' &&
    typeof value.period === 'string' &&
    isOptionalString(value.location) &&
    isStringArray(value.achievements);

const isProject = (value: unknown): boolean =>
    isRecord(value) &&
    typeof value.name === 'string' &&
    (value.type === 'Académico' || value.type === 'Personal' || value.type === 'Freelance') &&
    isStringArray(value.toolsAndMethods) &&
    typeof value.description === 'string' &&
    isStringArray(value.highlights);

const isEducation = (value: unknown): boolean =>
    isRecord(value) &&
    typeof value.degree === 'string' &&
    typeof value.institution === 'string' &&
    typeof value.period === 'string' &&
    isOptionalString(value.status);

export const isAdaptedCv = (value: unknown): value is AdaptedCv => {
    if (!isRecord(value) || !isRecord(value.personalInfo)) return false;

    const personalInfo = value.personalInfo;
    return (
        typeof personalInfo.fullName === 'string' &&
        typeof personalInfo.targetRoleTitle === 'string' &&
        isOptionalString(personalInfo.email) &&
        isOptionalString(personalInfo.phone) &&
        isOptionalString(personalInfo.location) &&
        isOptionalString(personalInfo.linkedin) &&
        isOptionalString(personalInfo.github) &&
        isOptionalString(personalInfo.portfolio) &&
        typeof value.professionalSummary === 'string' &&
        Array.isArray(value.keySkills) &&
        value.keySkills.every(isKeySkill) &&
        Array.isArray(value.workExperience) &&
        value.workExperience.every(isWorkExperience) &&
        Array.isArray(value.academicAndPersonalProjects) &&
        value.academicAndPersonalProjects.every(isProject) &&
        Array.isArray(value.education) &&
        value.education.every(isEducation) &&
        (value.certificationsAndCourses === undefined || isStringArray(value.certificationsAndCourses)) &&
        (value.languages === undefined || isStringArray(value.languages))
    );
};
