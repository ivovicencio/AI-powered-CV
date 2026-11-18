import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export const documentService = {
    extractTextFromBuffer: async (file: Express.Multer.File): Promise<string> => {
        if (!file || !file.buffer || file.buffer.length === 0) {
            throw new Error('El archivo recibido está vacío.');
        }

        let extractedText = '';

        if (file.mimetype === 'application/pdf') {
            const parser = new PDFParse({ data: file.buffer });
            const data = await parser.getText();
            extractedText = data.text;
            await parser.destroy();
        } else if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            extractedText = result.value;
        } else {
            throw new Error('Formato de archivo no soportado.');
        }

        const cleanedText = extractedText
            .replace(/\r\n?/g, '\n')
            .replace(/\u00a0/g, ' ')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ])-\n(?=[a-záéíóúüñ])/g, '$1')
            .split('\n')
            .map(line => line.replace(/[ \t]+/g, ' ').trim())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (cleanedText.length < 30) {
            throw new Error('No se pudo extraer texto suficiente del CV. Verificá que el PDF no sea una imagen escaneada.');
        }

        return cleanedText;
    }
};