import assert from 'node:assert/strict';
import { AdaptedCv } from '../src/interfaces/cv.interface';
import { cvGeneratorService } from '../src/services/cv-generator.service';

const economicProfile: AdaptedCv = {
    personalInfo: {
        fullName: 'Alex Ejemplo',
        targetRoleTitle: 'Analista económico-financiera',
        email: 'alex@example.com'
    },
    professionalSummary: 'Perfil orientado al análisis económico y financiero.',
    keySkills: [
        {
            category: 'Economía y finanzas',
            skills: ['Análisis financiero', 'Elaboración de presupuestos']
        }
    ],
    workExperience: [],
    academicAndPersonalProjects: [
        {
            name: 'Análisis de indicadores económicos',
            type: 'Académico',
            toolsAndMethods: ['Estadística descriptiva', 'Excel'],
            description: 'Estudio de indicadores y tendencias económicas.',
            highlights: ['Preparación de informes para presentar resultados.']
        }
    ],
    education: [
        {
            degree: 'Licenciatura en Economía',
            institution: 'Universidad Ejemplo',
            period: '2022–2026'
        }
    ]
};

const main = async (): Promise<void> => {
    const [docx, pdf] = await Promise.all([
        cvGeneratorService.generateDocx(economicProfile),
        cvGeneratorService.generatePdf(economicProfile)
    ]);

    assert.equal(docx.subarray(0, 2).toString(), 'PK');
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    console.log('Exportación de un perfil económico a DOCX y PDF OK.');
};

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
