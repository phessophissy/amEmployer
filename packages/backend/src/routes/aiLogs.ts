import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── GET /api/ai-logs ─────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, jobId, limit = '50', offset = '0' } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.logType = String(type);
    if (jobId) where.jobId = String(jobId);
    const [logs, total] = await Promise.all([
      prisma.aILog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(String(limit)), 200),
        skip: parseInt(String(offset)),
        include: { job: { select: { title: true } } },
      }),
      prisma.aILog.count({ where }),
    ]);
    res.json({ success: true, data: logs, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI logs' });
  }
});

export default router;

// ─── GET /api/ai-logs/recent ──────────────────────────────────────────────
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const logs = await prisma.aILog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(String(limit)), 100),
      include: { job: { select: { title: true } } },
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent AI logs' });
  }
});

// ─── GET /api/ai-logs/errors ──────────────────────────────────────────────
router.get('/errors', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const logs = await prisma.aILog.findMany({
      where: { logType: 'ERROR' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(String(limit)), 100),
      include: { job: { select: { title: true } } },
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});
