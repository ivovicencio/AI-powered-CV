import type { AdaptedCv } from '../../interfaces/cv.interface';
import type { CvFieldChange } from './cv-editable-field.directive';

const parseIndex = (value: string | undefined, length: number): number | null => {
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const index = Number(value);
  return Number.isSafeInteger(index) && index < length ? index : null;
};

const splitList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const updateCvField = (cv: AdaptedCv, change: CvFieldChange): AdaptedCv => {
  const parts = change.path.split('.');
  const value = change.value;

  if (parts[0] === 'personalInfo') {
    const field = parts[1];
    if (
      field === 'fullName' ||
      field === 'targetRoleTitle' ||
      field === 'email' ||
      field === 'phone' ||
      field === 'location' ||
      field === 'linkedin' ||
      field === 'github' ||
      field === 'portfolio'
    ) {
      return { ...cv, personalInfo: { ...cv.personalInfo, [field]: value } };
    }
    return cv;
  }

  if (parts[0] === 'professionalSummary' && parts.length === 1) {
    return { ...cv, professionalSummary: value };
  }

  if (parts[0] === 'keySkills') {
    const index = parseIndex(parts[1], cv.keySkills.length);
    if (index === null) return cv;

    return {
      ...cv,
      keySkills: cv.keySkills.map((group, itemIndex) => {
        if (itemIndex !== index) return group;
        if (parts[2] === 'category') return { ...group, category: value };
        if (parts[2] === 'skills') return { ...group, skills: splitList(value) };
        return group;
      }),
    };
  }

  if (parts[0] === 'workExperience') {
    const index = parseIndex(parts[1], cv.workExperience.length);
    if (index === null) return cv;

    return {
      ...cv,
      workExperience: cv.workExperience.map((experience, itemIndex) => {
        if (itemIndex !== index) return experience;

        if (parts[2] === 'achievements') {
          const achievementIndex = parseIndex(parts[3], experience.achievements.length);
          if (achievementIndex === null) return experience;
          return {
            ...experience,
            achievements: experience.achievements.map((achievement, bulletIndex) =>
              bulletIndex === achievementIndex ? value : achievement,
            ),
          };
        }

        if (
          parts[2] === 'role' ||
          parts[2] === 'company' ||
          parts[2] === 'period' ||
          parts[2] === 'location'
        ) {
          return { ...experience, [parts[2]]: value };
        }
        return experience;
      }),
    };
  }

  if (parts[0] === 'academicAndPersonalProjects') {
    const index = parseIndex(parts[1], cv.academicAndPersonalProjects.length);
    if (index === null) return cv;

    return {
      ...cv,
      academicAndPersonalProjects: cv.academicAndPersonalProjects.map((project, itemIndex) => {
        if (itemIndex !== index) return project;
        if (parts[2] === 'name' || parts[2] === 'description') {
          return { ...project, [parts[2]]: value };
        }
        if (parts[2] === 'toolsAndMethods') {
          return { ...project, toolsAndMethods: splitList(value) };
        }
        if (parts[2] === 'highlights') {
          const highlightIndex = parseIndex(parts[3], project.highlights.length);
          if (highlightIndex === null) return project;
          return {
            ...project,
            highlights: project.highlights.map((highlight, itemHighlightIndex) =>
              itemHighlightIndex === highlightIndex ? value : highlight,
            ),
          };
        }
        return project;
      }),
    };
  }

  if (parts[0] === 'education') {
    const index = parseIndex(parts[1], cv.education.length);
    if (index === null) return cv;
    const field = parts[2];
    if (field !== 'degree' && field !== 'institution' && field !== 'period' && field !== 'status')
      return cv;

    return {
      ...cv,
      education: cv.education.map((education, itemIndex) =>
        itemIndex === index ? { ...education, [field]: value } : education,
      ),
    };
  }

  if (parts[0] === 'certificationsAndCourses') {
    const certifications = cv.certificationsAndCourses ?? [];
    const index = parseIndex(parts[1], certifications.length);
    if (index === null) return cv;

    return {
      ...cv,
      certificationsAndCourses: certifications.map((certification, itemIndex) =>
        itemIndex === index ? value : certification,
      ),
    };
  }

  if (parts[0] === 'languages') {
    const languages = cv.languages ?? [];
    const index = parseIndex(parts[1], languages.length);
    if (index === null) return cv;

    return {
      ...cv,
      languages: languages.map((language, itemIndex) => (itemIndex === index ? value : language)),
    };
  }

  return cv;
};

export const updateCvProjectType = (cv: AdaptedCv, index: number, type: string): AdaptedCv => {
  if (
    !Number.isSafeInteger(index) ||
    index < 0 ||
    (type !== 'Académico' && type !== 'Personal' && type !== 'Freelance') ||
    index >= cv.academicAndPersonalProjects.length
  ) {
    return cv;
  }

  return {
    ...cv,
    academicAndPersonalProjects: cv.academicAndPersonalProjects.map((project, itemIndex) =>
      itemIndex === index ? { ...project, type } : project,
    ),
  };
};
