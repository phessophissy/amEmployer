import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validationQueue, assignmentQueue } from '../services/queue/taskQueue';
import logger from '../lib/logger';

const router = Router();

// ─── GET /api/tasks ────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, worker, jobId, limit = '50', offset = '0' } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (worker) where.assignedWorker = worker;
    if (jobId) where.jobId = jobId;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit as string), 200),
      skip: parseInt(offset as string),
      include: { payments: { select: { txHash: true, status: true, amount: true } } },
    });

    const total = await prisma.task.count({ where });
    res.json({ success: true, data: tasks, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// ─── GET /api/tasks/open ────────────────────────────────────────────────────────
router.get('/open', async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { status: 'OPEN' },
      orderBy: { reward: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch open tasks' });
  }
});

// ─── GET /api/tasks/:id ─────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: String(req.params.id) },
      include: { job: true, payments: true },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// ─── POST /api/tasks/:id/submit ─────────────────────────────────────────────────
const SubmitWorkSchema = z.object({
  submission: z.string().min(1).max(10000),
  workerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const body = SubmitWorkSchema.parse(req.body);
    const taskId = String(req.params.id);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'ASSIGNED') {
      return res.status(400).json({ error: 'Task not in ASSIGNED state' });
    }
    if (task.assignedWorker !== body.workerAddress) {
      return res.status(403).json({ error: 'Not assigned to this worker' });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'SUBMITTED', submission: body.submission },
    });

    await validationQueue.add('validate', { taskId });

    res.json({ success: true, message: 'Submission received — validation queued' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to submit work' });
  }
});

// ─── POST /api/tasks/:id/assign ─────────────────────────────────────────────────
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    await assignmentQueue.add('assign', { taskId }, { priority: 1 });
    res.json({ success: true, message: 'Task queued for assignment' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to queue assignment' });
  }
});

export default router;

// ─── GET /api/tasks/stats ──────────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [open, assigned, submitted, verified, paid, rejected] = await Promise.all([
      prisma.task.count({ where: { status: 'OPEN' } }),
      prisma.task.count({ where: { status: 'ASSIGNED' } }),
      prisma.task.count({ where: { status: 'SUBMITTED' } }),
      prisma.task.count({ where: { status: 'VERIFIED' } }),
      prisma.task.count({ where: { status: 'PAID' } }),
      prisma.task.count({ where: { status: 'REJECTED' } }),
    ]);
    res.json({ success: true, data: { open, assigned, submitted, verified, paid, rejected } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task stats' });
  }
});

// ─── GET /api/tasks/high-reward ────────────────────────────────────────────
router.get('/high-reward', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const tasks = await prisma.task.findMany({
      where: { status: 'OPEN' },
      orderBy: { reward: 'desc' },
      take: Math.min(parseInt(String(limit)), 100),
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch high-reward tasks' });
  }
});

// ─── GET /api/tasks/expiring-soon ─────────────────────────────────────────
router.get('/expiring-soon', async (req: Request, res: Response) => {
  try {
    const { hours = '24' } = req.query;
    const cutoff = new Date(Date.now() + parseInt(String(hours)) * 3_600_000);
    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ['OPEN', 'ASSIGNED'] },
        deadline: { lte: cutoff, gte: new Date() },
      },
      orderBy: { deadline: 'asc' },
      take: 50,
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expiring tasks' });
  }
});

// ─── GET /api/tasks/recent-completions ────────────────────────────────────
router.get('/recent-completions', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const tasks = await prisma.task.findMany({
      where: { status: 'PAID' },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(parseInt(String(limit)), 50),
      include: {
        job: { select: { title: true } },
        payments: { select: { txHash: true, amount: true } },
      },
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent completions' });
  }
});
