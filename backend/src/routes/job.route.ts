import { Router } from 'express';
import { jobCtrl } from '../controllers/job.controller';

const router = Router();

router.post('/extract', jobCtrl.extractJobDescription);

export default router;