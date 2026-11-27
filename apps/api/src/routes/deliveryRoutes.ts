import { Router } from 'express';
import { DeliveryController } from '../controllers/deliveryController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@postmate/shared';

const router = Router();

router.use(authenticateToken);

router.get('/', DeliveryController.list);
router.get('/my', DeliveryController.getMyDeliveries);
router.get('/summary', DeliveryController.getSummary);
router.post('/assign', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), DeliveryController.assign);
router.patch('/status/:mailId', DeliveryController.updateStatus);

export default router;
