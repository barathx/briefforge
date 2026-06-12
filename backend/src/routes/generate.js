import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { triggerGeneration, regenerate } from '../controllers/generateController.js';

const router = Router();

// All generate routes require a valid JWT
router.use(verifyToken);

// POST /api/generate/:briefId             → trigger full generation for a brief
router.post('/:briefId', triggerGeneration);

// POST /api/generate/:briefId/regenerate  → regenerate a specific type + platform
router.post('/:briefId/regenerate', regenerate);

export default router;
