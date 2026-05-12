import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

async function checkDb(): Promise<boolean> {
  try { await prisma.$queryRaw`SELECT 1`; return true; } catch { return false; }
}

router.get('/', async (_req: Request, res: Response) => {
  const db = await checkDb();
  const status = db ? 'ok' : 'degraded';
  res.status(db ? 200 : 503).json({ status, db, timestamp: new Date().toISOString() });
});
export default router;
