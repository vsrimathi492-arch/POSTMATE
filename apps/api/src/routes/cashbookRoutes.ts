import { Router } from 'express';
import { CashbookController } from '../controllers/cashbookController';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@postmate/shared';

const router = Router();

router.use(authenticateToken);

router.get('/transactions', CashbookController.getTransactions);
router.get('/balance', CashbookController.getDailyBalance);
router.post('/transactions', CashbookController.createTransaction);
router.patch('/transactions/:id/verify', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), CashbookController.verifyTransaction);
router.post('/reconcile', requireRole(UserRole.ADMIN, UserRole.POSTMASTER), CashbookController.reconcile);

export default router;
