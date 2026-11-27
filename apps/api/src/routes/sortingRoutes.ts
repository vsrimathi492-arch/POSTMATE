import { Router } from 'express';
import { SortingController } from '../controllers/sortingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/suggestions', SortingController.getGroupingSuggestions);
router.get('/batches', SortingController.listBatches);
router.post('/batches', SortingController.createBatch);
router.patch('/batches/:id', SortingController.updateBatchStatus);

export default router;
