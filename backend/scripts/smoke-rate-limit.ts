/**
 * Smoke test del rate limiting. No usa Redis ni la key de Groq:
 * configura límites chicos y verifica los códigos de respuesta.
 *
 * Ejecutar: npm run test:rate-limit
 */
process.env.UPSTASH_REDIS_REST_URL = '';
process.env.UPSTASH_REDIS_REST_TOKEN = '';
process.env.RATE_LIMIT_MAX = '2';
process.env.RATE_LIMIT_WINDOW_MS = '3600000';
process.env.DAILY_ADAPT_LIMIT = '1';

const assertStatus = (actual: number, expected: number, label: string): void => {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${expected}, obtenido ${actual}`);
  }
};

(async () => {
  const { default: app } = await import('../src/app.ts');
  const server = app.listen(0);

  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const base = `http://127.0.0.1:${port}`;

    const call = async (
      method: string,
      path: string,
      ip: string,
      headers: Record<string, string> = {},
      body?: string
    ): Promise<number> => {
      const response = await fetch(base + path, {
        method,
        headers: { 'x-forwarded-for': ip, ...headers },
        body
      });
      await response.text();
      return response.status;
    };

    assertStatus(await call('GET', '/api/health', '9.9.9.9'), 200, 'health público');

    const json = { 'content-type': 'application/json' };
    const url = JSON.stringify({ url: 'http://localhost:3000/admin' });
    assertStatus(await call('POST', '/api/job/extract', '1.1.1.1', json, url), 422, 'extracción 1');
    assertStatus(await call('POST', '/api/job/extract', '1.1.1.1', json, url), 422, 'extracción 2');
    assertStatus(await call('POST', '/api/job/extract', '1.1.1.1', json, url), 429, 'límite por IP');

    assertStatus(await call('POST', '/api/cv/adapt', '2.2.2.2'), 400, 'adaptación 1');
    assertStatus(await call('POST', '/api/cv/adapt', '2.2.2.2'), 429, 'cupo diario');

    console.log('OK: rate limit y cupo diario responden como se esperaba');
  } finally {
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
