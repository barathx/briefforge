import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import authRouter from './routes/auth.js';
import clientsRouter from './routes/clients.js';
import briefsRouter from './routes/briefs.js';
import generateRouter from './routes/generate.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();

// ── Security & utility middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/briefs', briefsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/dashboard', dashboardRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ── Root route ────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'BriefForge API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health:    'GET  /health',
      auth:      'POST /api/auth/signup  |  POST /api/auth/login',
      clients:   'GET  /api/clients      |  POST /api/clients',
      briefs:    'GET  /api/briefs       |  POST /api/briefs  |  GET /api/briefs/:id  |  DELETE /api/briefs/:id',
      generate:  'POST /api/generate/:briefId  |  POST /api/generate/:briefId/regenerate',
      dashboard: 'GET  /api/dashboard/stats',
    },
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BriefForge API running on port ${PORT}`);
});

export default app;
