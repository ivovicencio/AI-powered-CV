import { Router } from 'express';
import { upload } from '../middlewares/upload.middleware';
import { cvCtrl } from '../controllers/cv.controller';

const router = Router();

router.post('/adapt', upload.single('cvFile'), cvCtrl.adaptCv);
router.post('/export/docx', cvCtrl.exportDocx);
router.post('/export/pdf', cvCtrl.exportPdf);

export default router;