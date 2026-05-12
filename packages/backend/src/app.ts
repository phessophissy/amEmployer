import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import jobsRouter from './routes/jobs';
import tasksRouter from './routes/tasks';
import workersRouter from './routes/workers';
import simulationRouter from './routes/simulation';
import statsRouter from './routes/stats';
import healthRouter from './routes/health';

const app = express();

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  // Vercel deployments — exact URL and preview branches
  /^https:\/\/amemployer(-[a-z0-9-]+)?\.vercel\.app$/,
];
if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = ALLOWED_ORIGINS.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error(`CORS: origin not allowed — ${origin}`), allowed);
  },
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
app.use('/health', healthRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.use('/api/ai-logs', aiLogsRouter);
export default app;
