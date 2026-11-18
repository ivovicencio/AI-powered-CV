export class AiServiceError extends Error {
    constructor(message: string, readonly statusCode: 502 | 503) {
        super(message);
        this.name = 'AiServiceError';
    }
}
