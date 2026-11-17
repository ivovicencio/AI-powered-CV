import app from './app';

// En Vercel el Express app se exporta como Function (vercel.json → entrypoint).
// El listen() queda solo para desarrollo local.
const isProductionRuntime = Boolean(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV === 'production'
);

if (!isProductionRuntime && typeof (app as { listen?: unknown }).listen === 'function') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log('Servidor iniciado en el puerto', port);
    });
}

export default app;
