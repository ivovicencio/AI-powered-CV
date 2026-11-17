import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no soportado. Solo se permiten archivos PDF o DOCX.'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 4 * 1024 * 1024 // 4 MB (por debajo del límite de 4.5 MB de Vercel)
    }
});