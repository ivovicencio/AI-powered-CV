import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import cvRoutes from './routes/cv.route';
import jobRoutes from './routes/job.route';
import { dailyAdaptCap, rateLimiter } from './middlewares/rate-limit';

const app = express();

app.disable('x-powered-by');
// Detrás de Vercel el IP real viene en x-forwarded-for.
app.set('trust proxy', 1);

// Cabeceras base: reducen fingerprinting, clickjacking y lecturas de MIME.
// No se configura CSP porque el front usa estilos de Bootstrap y fuentes de Google.
app.use((_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));

// /health queda público para el smoke test de Vercel. Todo lo que consume
// recursos (extracción, IA, exportación) pasa por límite por IP.
const protectedPaths = ['/cv', '/api/cv', '/job', '/api/job'];
app.use(protectedPaths, rateLimiter);
// Ambas generaciones consumen IA: comparten el cupo diario.
app.use(
    ['/cv/adapt', '/api/cv/adapt', '/cv/proactive', '/api/cv/proactive'],
    dailyAdaptCap
);

// Las rutas se montan en "/" y "/api" para que el mismo código sirva tanto
// en el servidor local como en la Function de Vercel (api/[...path].ts),
// según cómo el runtime reenvíe la URL original.
app.use(['/cv', '/api/cv'], cvRoutes);
app.use(['/job', '/api/job'], jobRoutes);

app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
    res.json({ status: '1', msg: 'Backend AI-CV en TS funcionando correctamente' });
});

// Los errores de multer (formato/límite) llegan acá y no quedan como HTML 500.
app.use((error: unknown, _req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
        next(error);
        return;
    }

    const isUploadError = error instanceof multer.MulterError;
    const errorStatus = (error as { status?: number }).status;
    const isClientError = !!errorStatus && errorStatus >= 400 && errorStatus < 500;
    const status = isUploadError ? 400 : isClientError ? errorStatus! : 500;
    const msg = isUploadError
        ? error.code === 'LIMIT_FILE_SIZE'
            ? 'El archivo supera el límite de 4 MB.'
            : 'No se pudo procesar el archivo adjunto.'
        : isClientError
            ? 'La solicitud no es válida.'
            : error instanceof Error
                ? error.message
                : 'Error interno del servidor.';

    res.status(status).json({ status: '0', msg });
});

export default app;
