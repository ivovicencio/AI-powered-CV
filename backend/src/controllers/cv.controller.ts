import { Request, Response } from 'express';
import { documentService } from '../services/document.service';
import { aiService } from '../services/ai.service';
import { cvGeneratorService } from '../services/cv-generator.service';
import { isAdaptedCv } from '../utils/validate-cv';

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

            res.status(500).json({
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