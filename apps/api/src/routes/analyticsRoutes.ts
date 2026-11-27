import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', AnalyticsController.getDashboardMetrics);

export default router;
