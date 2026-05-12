import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();
const START_TIME = Date.now();

async function checkDb(): Promise<boolean> {
  try { await prisma.$queryRaw`SELECT 1`; return true; } catch { return false; }
}

router.get('/', async (_req: Request, res: Response) => {
  const db = await checkDb();
  const status = db ? 'ok' : 'degraded';
  res.status(db ? 200 : 503).json({
    status,
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    db,
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (_req: Request, res: Response) => {
  const db = await checkDb();
  res.status(db ? 200 : 503).json({ ready: db });
});

router.get('/live', (_req: Request, res: Response) => {
  res.json({ live: true });
});

export default router;
