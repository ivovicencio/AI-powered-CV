import { Request, Response } from 'express';
import { jobExtractorService } from '../services/job-extractor.service';

export const jobCtrl = {
    extractJobDescription: async (req: Request, res: Response): Promise<void> => {
        try {
            const { url } = req.body as { url?: string };

            if (!url) {
                res.status(400).json({
                    status: '0',
                    msg: 'Debe proporcionar una URL válida.'
                });
                return;
            }

            const extractedText = await jobExtractorService.extractFromUrl(url);

            res.json({
                status: '1',
                msg: 'Descripción extraída correctamente.',
                data: { description: extractedText }
            });
        } catch (error: unknown) {
            const message = error instanceof Error
                ? error.message
                : 'No se pudo extraer automáticamente la oferta. Pegala manualmente.';

            res.status(422).json({
                status: '0',
                msg: message
            });
        }
    }
};