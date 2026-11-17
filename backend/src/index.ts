import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cvRoutes from './routes/cv.route';
import jobRoutes from './routes/job.route';

const app: Application = express();

//Middlewares
app.use(express.json({limit: '5mb'}));
app.use(cors({origin:process.env.CORS_ORIGIN || 'http://localhost:4200'}));

//Rutas
app.use('/api/cv', cvRoutes);
app.use('/api/job', jobRoutes);

//Ruta de verificacion
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({status:'1', msg: 'Backend AI-CV en TS funcionando correctamente'});
});

//Setting
app.set('port', process.env.PORT || 3000);

//inicio del servidor
app.listen(app.get('port'), () => {
    console.log('Servidor iniciado en el puerto', app.get('port'));
});