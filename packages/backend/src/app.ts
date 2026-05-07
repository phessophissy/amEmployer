import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import jobsRouter from './routes/jobs';
import tasksRouter from './routes/tasks';
import workersRouter from './routes/workers';
import simulationRouter from './routes/simulation';
import statsRouter from './routes/stats';

const app = express();

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'amEmployer' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/jobs', jobsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/workers', workersRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/stats', statsRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

export default app;
