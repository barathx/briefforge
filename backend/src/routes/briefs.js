import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  createBrief,
  listBriefs,
  getBrief,
  deleteBrief,
} from '../controllers/briefsController.js';

const router = Router();

// All briefs routes require a valid JWT
router.use(verifyToken);

// POST   /api/briefs        → create a new brief
router.post('/', createBrief);

// GET    /api/briefs        → list briefs (with optional filters)
router.get('/', listBriefs);

// GET    /api/briefs/:id    → get a single brief + its generations
router.get('/:id', getBrief);

// DELETE /api/briefs/:id    → delete a brief (ownership enforced)
router.delete('/:id', deleteBrief);

export default router;
