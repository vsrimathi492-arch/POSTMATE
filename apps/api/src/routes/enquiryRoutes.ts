import { Router } from 'express';
import { EnquiryController } from '../controllers/enquiryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/search', EnquiryController.search);
router.get('/', EnquiryController.list);
router.post('/', EnquiryController.create);
router.patch('/:id/resolution', EnquiryController.updateResolution);

export default router;
