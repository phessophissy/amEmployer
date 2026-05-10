import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { decompositionQueue } from '../services/queue/taskQueue';
import { blockchain } from '../services/blockchain';
import { ethers } from 'ethers';
import logger from '../lib/logger';

const router = Router();

// ─── Validation schemas ────────────────────────────────────────────────────────

const CreateJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  totalBudget: z.number().positive().max(100000),
  employerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
});

// ─── GET /api/jobs ─────────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { tasks: true } },
      },
    });
    res.json({ success: true, data: jobs });
  } catch (err) {
    logger.error('GET /jobs error', { err });
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ─── GET /api/jobs/:id ─────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: String(req.params.id) },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
        aiLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// ─── POST /api/jobs ─────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = CreateJobSchema.parse(req.body);

    const job = await prisma.job.create({
      data: {
        title: body.title,
        description: body.description,
        totalBudget: body.totalBudget,
        employerAddress: body.employerAddress,
        status: 'PENDING',
      },
    });

    logger.info(`Job created: ${job.id} — "${job.title}"`);

    // Enqueue decomposition — non-blocking: job is already saved so don't fail
    // the request if Redis is temporarily unavailable.
    decompositionQueue.add('decompose', { jobId: job.id }).catch((qErr) => {
      logger.error(`Failed to enqueue decomposition for job ${job.id} — will retry on next poll`, { qErr });
    });

    res.status(201).json({ success: true, data: job });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('POST /jobs error', { err });
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// ─── POST /api/jobs/demo — one-click demo mode ─────────────────────────────────
router.post('/demo/launch', async (_req: Request, res: Response) => {
  try {
    const demoJobs = [
      {
        title: 'Label 500 E-commerce Product Images',
        description:
          'Review and categorize 500 product images from our e-commerce catalog. Each image needs: primary category (electronics/clothing/food/furniture/other), subcategory, quality rating (1-5), and any defect flags. Use the provided taxonomy guide.',
        totalBudget: 50,
        employerAddress: blockchain.getEmployerAddress() || '0x0000000000000000000000000000000000000001',
      },
      {
        title: 'Sentiment Analysis on Customer Reviews',
        description:
          'Analyze 300 customer support chat transcripts. For each: extract sentiment (positive/negative/neutral), identify primary complaint or praise category, rate urgency (1-3), and flag any legal or compliance risks.',
        totalBudget: 30,
        employerAddress: blockchain.getEmployerAddress() || '0x0000000000000000000000000000000000000001',
      },
    ];

    const created = [];
    for (const demoJob of demoJobs) {
      const job = await prisma.job.create({
        data: {
          title: demoJob.title,
          description: demoJob.description,
          totalBudget: demoJob.totalBudget,
          employerAddress: demoJob.employerAddress,
          status: 'PENDING',
        },
      });
      decompositionQueue.add('decompose', { jobId: job.id }).catch((qErr) => {
        logger.error(`Failed to enqueue demo job ${job.id}`, { qErr });
      });
      created.push(job);
    }

    res.json({ success: true, data: created, message: 'Demo economy launched!' });
  } catch (err) {
    logger.error('Demo launch error', { err });
    res.status(500).json({ error: 'Failed to launch demo' });
  }
});

// ─── GET /api/jobs/:id/ai-logs ──────────────────────────────────────────────────
router.get('/:id/ai-logs', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.aILog.findMany({
      where: { jobId: String(req.params.id) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
