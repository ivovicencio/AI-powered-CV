const STRICT_JSON_SCHEMA_MODELS = new Set([
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'meta-models/muse-spark-open'
]);

const stringArray = {
    type: 'array',
    items: { type: 'string' }
};

const objectSchema = (
    properties: Record<string, unknown>,
    required: string[]
): Record<string, unknown> => ({
    type: 'object',
    properties,
    required,
    additionalProperties: false
});

const cvSchema = objectSchema(
    {
        personalInfo: objectSchema(
            {
                fullName: { type: 'string' },
                targetRoleTitle: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                location: { type: 'string' },
                linkedin: { type: 'string' },
                github: { type: 'string' },
                portfolio: { type: 'string' }
            },
            ['fullName', 'targetRoleTitle', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio']
        ),
        professionalSummary: { type: 'string' },
        keySkills: {
            type: 'array',
            items: objectSchema(
                {
                    category: { type: 'string' },
                    skills: stringArray
                },
                ['category', 'skills']
            )
        },
        workExperience: {
            type: 'array',
            items: objectSchema(
                {
                    role: { type: 'string' },
                    company: { type: 'string' },
                    period: { type: 'string' },
                    location: { type: 'string' },
                    achievements: stringArray
                },
                ['role', 'company', 'period', 'location', 'achievements']
            )
        },
        academicAndPersonalProjects: {
            type: 'array',
            items: objectSchema(
                {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['Académico', 'Personal', 'Freelance'] },
                    toolsAndMethods: stringArray,
                    description: { type: 'string' },
                    highlights: stringArray
                },
                ['name', 'type', 'toolsAndMethods', 'description', 'highlights']
            )
        },
        education: {
            type: 'array',
            items: objectSchema(
                {
                    degree: { type: 'string' },
                    institution: { type: 'string' },
                    period: { type: 'string' },
                    status: { type: 'string' }
                },
                ['degree', 'institution', 'period', 'status']
            )
        },
        certificationsAndCourses: stringArray,
        languages: stringArray
    },
    [
        'personalInfo',
        'professionalSummary',
        'keySkills',
        'workExperience',
        'academicAndPersonalProjects',
        'education',
        'certificationsAndCourses',
        'languages'
    ]
);

const strictResponseFormat = {
    type: 'json_schema' as const,
    json_schema: {
        name: 'adapted_cv',
        strict: true,
        schema: cvSchema
    }
};

export const getCvResponseFormat = (model: string) =>
    STRICT_JSON_SCHEMA_MODELS.has(model) ? strictResponseFormat : { type: 'json_object' as const };
