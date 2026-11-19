import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { cvCtrl } from '../src/controllers/cv.controller';
import { aiService } from '../src/services/ai.service';
import { documentService } from '../src/services/document.service';
import { proactiveNoteService } from '../src/services/proactive-note.service';
import { AdaptedCv, ProactiveContext } from '../src/interfaces/cv.interface';

// El middleware se configura al importar app: este smoke usa su propio límite.
process.env.UPSTASH_REDIS_REST_URL = '';
process.env.UPSTASH_REDIS_REST_TOKEN = '';
process.env.RATE_LIMIT_MAX = '2';
process.env.RATE_LIMIT_WINDOW_MS = '3600000';
process.env.DAILY_ADAPT_LIMIT = '10';

const cv: AdaptedCv = {
    personalInfo: {
        fullName: 'Alex Ejemplo',
        targetRoleTitle: 'Analista financiero',
        email: 'alex@example.com',
        phone: '299 555 0101'
    },
    professionalSummary: 'Perfil orientado al análisis financiero y la planificación.',
    keySkills: [{ category: 'Finanzas', skills: ['Presupuestos'] }],
    workExperience: [
        {
            role: 'Asistente financiero',
            company: 'Empresa previa',
            period: '2024–2025',
            achievements: ['Preparó reportes mensuales.']
        }
    ],
    academicAndPersonalProjects: [],
    education: [
        {
            degree: 'Licenciatura en Economía',
            institution: 'Universidad Ejemplo',
            period: '2022–2026'
        }
    ],
    certificationsAndCourses: [],
    languages: ['Español']
};

const context: ProactiveContext = {
    sector: 'Economía, finanzas y contabilidad',
    organization: 'Coca-Cola Argentina',
    organizationKind: 'Multinacional',
    desiredRole: 'Analista financiero',
    note: 'Tengo experiencia en presupuestos.'
};

const note = proactiveNoteService.build(cv, context);

assert.match(note, /^Estimado equipo de Coca-Cola Argentina:/);
assert.match(note, /de forma espontánea/);
assert.match(note, /el rol de Analista financiero/);
assert.match(note, /Perfil orientado al análisis financiero/);
assert.match(note, /Además quiero destacar: Tengo experiencia en presupuestos\./);
assert.match(note, /alex@example\.com \| 299 555 0101/);
assert.doesNotMatch(note, /contratando|vacante|proceso de selección/i);

const withoutRoleOrNote = proactiveNoteService.build(cv, {
    ...context,
    desiredRole: '',
    note: ''
});

assert.match(withoutRoleOrNote, /el área de Economía, finanzas y contabilidad/);
assert.doesNotMatch(withoutRoleOrNote, /Además quiero destacar/);

const withoutContact = proactiveNoteService.build(
    {
        ...cv,
        personalInfo: {
            fullName: 'Alex Ejemplo',
            targetRoleTitle: 'Analista financiero'
        }
    },
    context
);

assert.ok(withoutContact.trimEnd().endsWith('Alex Ejemplo'));

// El controlador usa el mismo pipeline y devuelve el CV junto con la nota.
const checkController = async (): Promise<void> => {
    const originalExtract = documentService.extractTextFromBuffer;
    const originalAdapt = aiService.adaptCvProactive;
    let responseBody: unknown;
    let responseStatus = 200;

    const response = {
        status(code: number) {
            responseStatus = code;
            return this;
        },
        json(body: unknown) {
            responseBody = body;
            return this;
        }
    } as unknown as Response;

    const makeRequest = (body: Record<string, unknown>): Request =>
        ({
            body,
            file: {
                buffer: Buffer.from('cv'),
                mimetype: 'application/pdf',
                originalname: 'cv.pdf',
                size: 2
            }
        }) as unknown as Request;

    try {
        documentService.extractTextFromBuffer = async () => 'Texto extraído del CV';
        aiService.adaptCvProactive = async () => cv;

        await cvCtrl.proactiveCv(makeRequest(context), response);

        assert.equal(responseStatus, 200);
        const body = responseBody as { status: string; data: { cv: AdaptedCv; note: string } };
        assert.equal(body.status, '1');
        assert.equal(body.data.cv, cv);
        assert.match(body.data.note, /Coca-Cola Argentina/);

        responseBody = undefined;
        responseStatus = 200;
        await cvCtrl.proactiveCv(makeRequest({ ...context, sector: '' }), response);

        assert.equal(responseStatus, 400);
        assert.equal((responseBody as { status: string }).status, '0');
    } finally {
        documentService.extractTextFromBuffer = originalExtract;
        aiService.adaptCvProactive = originalAdapt;
    }
};

// La ruta debe estar montada y compartir el límite por IP del resto de /cv.
const checkRoute = async (): Promise<void> => {
    const { default: app } = await import('../src/app.ts');
    const server = app.listen(0);

    try {
        await new Promise<void>((resolve) => server.once('listening', resolve));
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        const url = `http://127.0.0.1:${port}/api/cv/proactive`;
        const call = async (): Promise<number> => {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'x-forwarded-for': '8.8.8.8' }
            });
            await response.text();
            return response.status;
        };

        assert.equal(await call(), 400, 'sin archivo debe llegar al controlador');
        assert.equal(await call(), 400, 'segunda llamada dentro del límite');
        assert.equal(await call(), 429, 'la tercera llamada debe superar el límite por IP');
    } finally {
        server.close();
    }
};

(async () => {
    await checkController();
    await checkRoute();
    console.log('OK: postulación espontánea genera nota, valida el contexto y respeta límites');
})().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
