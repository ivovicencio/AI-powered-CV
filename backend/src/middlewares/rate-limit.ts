import { NextFunction, Request, Response } from 'express';

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const WINDOW_MS = toPositiveNumber(process.env.RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000);
const MAX_PER_WINDOW = toPositiveNumber(process.env.RATE_LIMIT_MAX, 10);
const DAILY_LIMIT = toPositiveNumber(process.env.DAILY_ADAPT_LIMIT, 50);

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = !!REDIS_URL && !!REDIS_TOKEN;

interface Counter {
    count: number;
    resetAt: number;
}

// Fallback en memoria. En Vercel cada instancia tiene el suyo: para un tope
// global de verdad hay que configurar Upstash (variables de arriba).
const ipCounters = new Map<string, Counter>();
let dailyCounter = { day: '', count: 0, resetAt: 0 };

const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};

const incrementInMemory = (map: Map<string, Counter>, key: string, resetAt: number): number => {
    let counter = map.get(key);
    if (!counter || Date.now() >= counter.resetAt) {
        counter = { count: 0, resetAt };
        map.set(key, counter);
    }
    counter.count += 1;

    if (map.size > 1000) {
        const now = Date.now();
        for (const [k, value] of map) {
            if (now >= value.resetAt) map.delete(k);
        }
    }

    return counter.count;
};

const redisCommand = async (command: (string | number)[]): Promise<unknown> => {
    const response = await fetch(REDIS_URL!, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${REDIS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(command),
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Upstash respondió ${response.status}`);
    }

    const payload = (await response.json()) as { result?: unknown; error?: string };
    if (payload.error) {
        throw new Error(payload.error);
    }
    return payload.result;
};

const redisIncrWithTtl = async (key: string, ttlSeconds: number): Promise<number> => {
    const result = await redisCommand(['INCR', key]);
    const count = Number(result);
    if (count === 1) {
        await redisCommand(['EXPIRE', key, ttlSeconds]);
    }
    return count;
};

export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const now = Date.now();
    const bucketId = Math.floor(now / WINDOW_MS);
    const resetAt = (bucketId + 1) * WINDOW_MS;
    const key = `${getClientIp(req)}:${bucketId}`;

    let count: number;
    if (hasRedis) {
        try {
            count = await redisIncrWithTtl(`cvolve:rl:${key}`, Math.ceil(WINDOW_MS / 1000));
        } catch (error) {
            console.error('Rate limit con Redis falló, uso memoria:', error);
            count = incrementInMemory(ipCounters, key, resetAt);
        }
    } else {
        count = incrementInMemory(ipCounters, key, resetAt);
    }

    if (count > MAX_PER_WINDOW) {
        const minutes = Math.ceil((resetAt - now) / 60000);
        res.setHeader('Retry-After', Math.ceil((resetAt - now) / 1000));
        res.status(429).json({
            status: '0',
            msg: `Límite de solicitudes alcanzado. Probá de nuevo en ${minutes} min.`
        });
        return;
    }

    next();
};

export const dailyAdaptCap = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    const day = new Date().toISOString().slice(0, 10);
    const resetAt = Date.parse(`${day}T00:00:00.000Z`) + 24 * 60 * 60 * 1000;

    let count: number;
    if (hasRedis) {
        try {
            count = await redisIncrWithTtl(`cvolve:daily:${day}`, 48 * 60 * 60);
        } catch (error) {
            console.error('Cupo diario con Redis falló, uso memoria:', error);
            count = dailyCounter.day === day ? dailyCounter.count + 1 : 1;
            dailyCounter = { day, count, resetAt };
        }
    } else {
        count = dailyCounter.day === day ? dailyCounter.count + 1 : 1;
        dailyCounter = { day, count, resetAt };
    }

    if (count > DAILY_LIMIT) {
        res.status(429).json({
            status: '0',
            msg: 'Se alcanzó el cupo diario de adaptaciones. Volvé mañana.'
        });
        return;
    }

    next();
};
