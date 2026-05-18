import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

const router = Router();

// ─── GET /api/workers ──────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, limit = '50', offset = '0' } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.workerType = type;

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { reputation: 'desc' },
      take: Math.min(parseInt(limit as string), 200),
      skip: parseInt(offset as string),
    });

    const total = await prisma.worker.count({ where });
    res.json({ success: true, data: workers, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// ─── GET /api/workers/leaderboard ──────────────────────────────────────────────
router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: [{ completedTasks: 'desc' }, { reputation: 'desc' }],
      take: 20,
    });
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ─── POST /api/workers/register ────────────────────────────────────────────────
const RegisterWorkerSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  workerType: z.enum(['HUMAN', 'SCRIPTED', 'AI_AGENT']).default('HUMAN'),
  personaName: z.string().max(50).optional(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = RegisterWorkerSchema.parse(req.body);

    const existing = await prisma.worker.findUnique({
      where: { walletAddress: body.walletAddress },
    });
    if (existing) {
      return res.json({ success: true, data: existing, message: 'Already registered' });
    }

    const worker = await prisma.worker.create({
      data: {
        walletAddress: body.walletAddress,
        workerType: body.workerType,
        personaName: body.personaName,
      },
    });

    logger.info(`Worker registered: ${body.walletAddress}`);
    res.status(201).json({ success: true, data: worker });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to register worker' });
  }
});

// ─── GET /api/workers/search ──────────────────────────────────────────────
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '20' } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Missing query param: q' });
    }
    const workers = await prisma.worker.findMany({
      where: {
        OR: [
          { walletAddress: { contains: q, mode: 'insensitive' } },
          { personaName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: Math.min(parseInt(String(limit)), 50),
      orderBy: { reputation: 'desc' },
    });
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─── GET /api/workers/top-earners ─────────────────────────────────────────
router.get('/top-earners', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      orderBy: { totalEarnings: 'desc' },
      take: Math.min(parseInt(String(limit)), 50),
      select: {
        walletAddress: true, personaName: true, totalEarnings: true,
        reputation: true, completedTasks: true, workerType: true,
      },
    });
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top earners' });
  }
});

// ─── GET /api/workers/by-type/:type ───────────────────────────────────────
router.get('/by-type/:type', async (req: Request, res: Response) => {
  try {
    const validTypes = ['HUMAN', 'SCRIPTED', 'AI_AGENT'];
    const type = String(req.params.type).toUpperCase();
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }
    const workers = await prisma.worker.findMany({
      where: { workerType: type as any, isActive: true },
      orderBy: { reputation: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workers by type' });
  }
});

// ─── GET /api/workers/:address ──────────────────────────────────────────────────
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { walletAddress: String(req.params.address) },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { task: { select: { title: true } } },
        },
      },
    });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    res.json({ success: true, data: worker });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

// ─── GET /api/workers/:address/tasks ──────────────────────────────────────
router.get('/:address/tasks', async (req: Request, res: Response) => {
  try {
    const { status, limit = '20' } = req.query;
    const where: Record<string, unknown> = { assignedWorker: String(req.params.address) };
    if (status) where.status = String(status);
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(String(limit)), 100),
      include: { job: { select: { title: true } } },
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch worker tasks' });
  }
});

// ─── GET /api/workers/:address/earnings ───────────────────────────────────
router.get('/:address/earnings', async (req: Request, res: Response) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { walletAddress: String(req.params.address) },
    });
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    const payments = await prisma.payment.findMany({
      where: { workerId: worker.id, status: 'CONFIRMED' },
      orderBy: { createdAt: 'desc' },
      select: { amount: true, createdAt: true, txHash: true },
    });
    const total = payments.reduce((s, p) => s + Number(p.amount), 0);
    res.json({ success: true, data: { total: total.toFixed(18), payments } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

export default router;
