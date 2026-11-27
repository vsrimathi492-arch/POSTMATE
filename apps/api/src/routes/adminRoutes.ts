import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@postmate/shared';

const router = Router();

router.use(authenticateToken);

router.get('/offices', AdminController.getOffices);
router.post('/offices', requireRole(UserRole.ADMIN), AdminController.createOffice);
router.get('/system-status', AdminController.getSystemStatus);
router.get('/users', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), AdminController.getUsers);
router.post('/users', requireRole(UserRole.ADMIN), AdminController.createUser);
router.patch('/users/:id', requireRole(UserRole.ADMIN), AdminController.updateUser);
router.get('/audit-logs', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), AdminController.getAuditLogs);

export default router;
