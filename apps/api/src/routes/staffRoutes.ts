import { Router } from 'express';
import { StaffController } from '../controllers/staffController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@postmate/shared';

const router = Router();

router.use(authenticateToken);

router.get('/', StaffController.list);
router.get('/workload-suggestions', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), StaffController.getWorkloadSuggestions);
router.post('/reassign', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), StaffController.reassignTasks);
router.patch('/:id/availability', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), StaffController.toggleAvailability);

export default router;
