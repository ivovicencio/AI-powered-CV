import app from './app';

const port = Number.parseInt(process.env.PORT || '80', 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un número entre 1 y 65535.');
}

const server = app.listen(port, '0.0.0.0', () => {
    console.log('Servidor iniciado en el puerto', port);
});

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});
