import { Router } from 'express';
import { ScanController } from '../controllers/scanController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/barcode', ScanController.scanBarcode);
router.post('/ocr', ScanController.extractOcrData);

export default router;
