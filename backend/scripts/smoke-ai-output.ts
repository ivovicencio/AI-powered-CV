import assert from 'node:assert/strict';
import { getCvResponseFormat } from '../src/services/ai-output.schema';
import { isAdaptedCv } from '../src/utils/validate-cv';

const validEconomicCv = {
    personalInfo: {
        fullName: 'Alex Ejemplo',
        targetRoleTitle: 'Analista económico-financiera'
    },
    professionalSummary: 'Perfil orientado al análisis financiero.',
    keySkills: [{ category: 'Economía y finanzas', skills: ['Análisis financiero'] }],
    workExperience: [
        {
            role: 'Asistente de investigación',
            company: 'Universidad Ejemplo',
            period: '2024–2025',
            achievements: ['Analizó indicadores económicos.']
        }
    ],
    academicAndPersonalProjects: [
        {
            name: 'Pronósticos económicos',
            type: 'Académico',
            toolsAndMethods: ['Estadística'],
            description: 'Estudio de tendencias y escenarios.',
            highlights: ['Presentó resultados a un equipo docente.']
        }
    ],
    education: [{ degree: 'Licenciatura en Economía', institution: 'Universidad Ejemplo', period: '2022–2026' }]
};

assert.equal(isAdaptedCv(validEconomicCv), true);

const invalidSkills = JSON.parse(JSON.stringify(validEconomicCv));
invalidSkills.keySkills[0].skills = ['Análisis', 42];
assert.equal(isAdaptedCv(invalidSkills), false);

const invalidProject = JSON.parse(JSON.stringify(validEconomicCv));
invalidProject.academicAndPersonalProjects[0].toolsAndMethods = 'Excel';
assert.equal(isAdaptedCv(invalidProject), false);

const strictFormat = getCvResponseFormat('openai/gpt-oss-120b');
assert.equal(strictFormat.type, 'json_schema');
if (strictFormat.type === 'json_schema') {
    assert.equal(strictFormat.json_schema.strict, true);
    assert.equal(strictFormat.json_schema.name, 'adapted_cv');
}
assert.equal(getCvResponseFormat('custom/model').type, 'json_object');

console.log('Contrato estructurado y validación de CV: casos válidos e inválidos OK.');
