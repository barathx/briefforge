import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { listClients, createClient } from '../controllers/clientsController.js';

const router = Router();

// All clients routes require a valid JWT
router.use(verifyToken);

// GET  /api/clients   → list all clients for authenticated user
router.get('/', listClients);

// POST /api/clients   → create a new client
router.post('/', createClient);

export default router;
