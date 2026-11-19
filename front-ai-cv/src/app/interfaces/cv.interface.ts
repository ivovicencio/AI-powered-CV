export interface AdaptedCv {
  personalInfo: {
    fullName: string;
    targetRoleTitle: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  professionalSummary: string;
  keySkills: {
    category: string;
    skills: string[];
  }[];
  workExperience: {
    role: string;
    company: string;
    period: string;
    location?: string;
    achievements: string[];
  }[];
  academicAndPersonalProjects: {
    name: string;
    type: 'Académico' | 'Personal' | 'Freelance';
    toolsAndMethods: string[];
    description: string;
    highlights: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    period: string;
    status?: string;
  }[];
  certificationsAndCourses?: string[];
  languages?: string[];
}

export interface ProactiveContext {
  sector: string;
  organization: string;
  organizationKind: string;
  desiredRole: string;
  note: string;
}

export interface ProactiveResult {
  cv: AdaptedCv;
  note: string;
}

export interface ApiResponse<T> {
  status: '0' | '1';
  msg: string;
  data?: T;
}