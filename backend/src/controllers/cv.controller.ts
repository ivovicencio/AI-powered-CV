import { Request, Response } from 'express';
import { documentService } from '../services/document.service';
import { aiService } from '../services/ai.service';
import { AiServiceError } from '../services/ai-service.error';
import { cvGeneratorService } from '../services/cv-generator.service';
import { isAdaptedCv } from '../utils/validate-cv';
import { ProactiveContext } from '../interfaces/cv.interface';
import { proactiveNoteService } from '../services/proactive-note.service';

// Los campos llegan como multipart: pueden repetirse y convertirse en arrays.
// Solo aceptamos strings y recortamos su longitud antes de mandarlos al prompt.
const readTextField = (value: unknown, maxLength: number): string =>
    typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export const cvCtrl = {
    adaptCv: async (req: Request, res: Response): Promise<void> => {
        try {
            const { jobDescription } = req.body as { jobDescription?: string };

            if (!req.file) {
                res.status(400).json({
                    status: '0',
                    msg: 'Debe adjuntar su CV en formato PDF o DOCX (máx. 4 MB).'
                });
                return;
            }

            if (!jobDescription || jobDescription.trim().length < 20) {
                res.status(400).json({
                    status: '0',
                    msg: 'Debe proporcionar la descripción de la oferta laboral.'
                });
                return;
            }

            // 1. Extraer texto del buffer en memoria
            const rawCvText = await documentService.extractTextFromBuffer(req.file);

            // 2. Adaptar contenido con Groq IA
            const adaptedCvJson = await aiService.adaptCvContent(rawCvText, jobDescription);

            // 3. Liberar buffer de memoria explícitamente
            req.file.buffer = Buffer.alloc(0);

            res.json({
                status: '1',
                msg: 'CV adaptado exitosamente.',
                data: adaptedCvJson
            });
        } catch (error: unknown) {
            if (req.file) {
                req.file.buffer = Buffer.alloc(0);
            }

            const message = error instanceof Error
                ? error.message
                : 'Error procesando la adaptación del CV.';

            const status = error instanceof AiServiceError ? error.statusCode : 500;
            res.status(status).json({
                status: '0',
                msg: message
            });
        }
    },

    proactiveCv: async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({
                    status: '0',
                    msg: 'Debe adjuntar su CV en formato PDF o DOCX (máx. 4 MB).'
                });
                return;
            }

            const context: ProactiveContext = {
                sector: readTextField(req.body.sector, 80),
                organization: readTextField(req.body.organization, 120),
                organizationKind: readTextField(req.body.organizationKind, 40),
                desiredRole: readTextField(req.body.desiredRole, 120),
                note: readTextField(req.body.note, 1000)
            };

            if (context.sector.length < 2) {
                res.status(400).json({
                    status: '0',
                    msg: 'Debe elegir el rubro de la organización.'
                });
                return;
            }

            if (context.organization.length < 3) {
                res.status(400).json({
                    status: '0',
                    msg: 'Debe elegir una empresa u organismo, o escribir el nombre de uno.'
                });
                return;
            }

            const rawCvText = await documentService.extractTextFromBuffer(req.file);
            const adaptedCv = await aiService.adaptCvProactive(rawCvText, context);
            const note = proactiveNoteService.build(adaptedCv, context);

            req.file.buffer = Buffer.alloc(0);

            res.json({
                status: '1',
                msg: 'CV espontáneo generado exitosamente.',
                data: { cv: adaptedCv, note }
            });
        } catch (error: unknown) {
            if (req.file) {
                req.file.buffer = Buffer.alloc(0);
            }

            const message = error instanceof Error
                ? error.message
                : 'Error procesando la postulación espontánea.';

            const status = error instanceof AiServiceError ? error.statusCode : 500;
            res.status(status).json({
                status: '0',
                msg: message
            });
        }
    },

    exportDocx: async (req: Request, res: Response): Promise<void> => {
        try {
            const { cvData } = req.body as { cvData?: unknown };
            if (!isAdaptedCv(cvData)) {
                res.status(400).json({
                    status: '0',
                    msg: 'Los datos del CV no son válidos.'
                });
                return;
            }
            const buffer = await cvGeneratorService.generateDocx(cvData);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', 'attachment; filename=CV_Adaptado.docx');
            res.send(buffer);
        } catch (_error) {
            res.status(500).json({
                status: '0',
                msg: 'Error generando el documento DOCX.'
            });
        }
    },

    exportPdf: async (req: Request, res: Response): Promise<void> => {
        try {
            const { cvData } = req.body as { cvData?: unknown };
            if (!isAdaptedCv(cvData)) {
                res.status(400).json({
                    status: '0',
                    msg: 'Los datos del CV no son válidos.'
                });
                return;
            }
            const buffer = await cvGeneratorService.generatePdf(cvData);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=CV_Adaptado.pdf');
            res.send(buffer);
        } catch (_error) {
            res.status(500).json({
                status: '0',
                msg: 'Error generando el documento PDF.'
            });
        }
    }
};