import { Router } from 'express';
import { MailController } from '../controllers/mailController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', MailController.list);
router.get('/summary', MailController.getSummary);
router.get('/tracking/:trackingNumber', MailController.getByTracking);
router.get('/:id', MailController.getById);
router.post('/', MailController.create);
router.patch('/:id', MailController.update);

export default router;
