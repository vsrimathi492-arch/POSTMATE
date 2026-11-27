import { Router } from 'express';
import { SyncController } from '../controllers/syncController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/batch', SyncController.syncBatch);

export default router;
