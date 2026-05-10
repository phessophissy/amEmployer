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

export default router;
