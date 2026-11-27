import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@postmate/shared';

const router = Router();

router.use(authenticateToken);

router.get('/', ReportController.list);
router.get('/:id', ReportController.getById);
router.get('/:id/pdf', ReportController.downloadPdf);
router.post('/generate', ReportController.generate);
router.patch('/:id/approve', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), ReportController.approve);

export default router;
