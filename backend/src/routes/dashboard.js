import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getDashboardStats } from '../controllers/dashboardController.js';

const router = Router();

// Require JWT auth for all dashboard endpoints
router.use(verifyToken);

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

export default router;
