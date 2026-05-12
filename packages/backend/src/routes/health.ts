import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createClient } from 'redis';

const router = Router();

async function checkDb(): Promise<boolean> {
  try { await prisma.$queryRaw`SELECT 1`; return true; } catch { return false; }
}

async function checkRedis(): Promise<boolean> {
  try {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    await client.ping();
    await client.disconnect();
    return true;
  } catch { return false; }
}

router.get('/', async (_req: Request, res: Response) => {
  const [db, redis] = await Promise.all([checkDb(), checkRedis()]);
  const status = db && redis ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({ status, db, redis, timestamp: new Date().toISOString() });
});
export default router;
