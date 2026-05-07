import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { getQueueStats } from '../services/queue/taskQueue';
import { blockchain } from '../services/blockchain';
import { broadcastSimulationUpdate } from '../websocket';
import logger from '../lib/logger';

const router = Router();

// ─── POST /api/simulation/start ────────────────────────────────────────────────
const StartSimSchema = z.object({
  walletCount: z.number().int().min(1).max(500).default(100),
  name: z.string().default('Stress Test'),
});

router.post('/start', async (req: Request, res: Response) => {
  try {
    const body = StartSimSchema.parse(req.body);

    const simulation = await prisma.simulationRun.create({
      data: {
        name: body.name,
        walletCount: body.walletCount,
        status: 'RUNNING',
      },
    });

    // Generate wallets and register them as workers asynchronously
    setImmediate(async () => {
      try {
        const { ethers } = await import('ethers');
        const crypto = await import('crypto');

        const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
        if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
          throw new Error('ENCRYPTION_KEY env var must be set and at least 32 characters');
        }

        const wallets = [];
        for (let i = 0; i < body.walletCount; i++) {
          const wallet = ethers.Wallet.createRandom();
          // AES-256-CBC encrypt the private key
          const iv = crypto.randomBytes(16);
          const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
            iv
          );
          let encrypted = cipher.update(wallet.privateKey, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          const encryptedKey = iv.toString('hex') + ':' + encrypted;

          wallets.push({
            simulationId: simulation.id,
            walletAddress: wallet.address,
            encryptedKey,
          });
        }

        // Batch insert wallets
        await prisma.simulationWallet.createMany({ data: wallets });

        // Register wallets as workers
        const addresses = wallets.map((w) => w.walletAddress);
        const personas = [
          'DataLabeler', 'Translator', 'Moderator', 'Researcher',
          'Annotator', 'Reviewer', 'Analyst', 'Validator',
        ];

        await prisma.worker.createMany({
          data: addresses.map((addr, i) => ({
            walletAddress: addr,
            workerType: i % 3 === 0 ? 'AI_AGENT' : 'SCRIPTED' as any,
            personaName: personas[i % personas.length],
            reputation: 30 + Math.floor(Math.random() * 50),
          })),
          skipDuplicates: true,
        });

        await prisma.simulationRun.update({
          where: { id: simulation.id },
          data: { tasksCreated: body.walletCount },
        });

        broadcastSimulationUpdate(simulation.id, {
          id: simulation.id,
          status: 'RUNNING',
          walletsGenerated: wallets.length,
          message: `Generated ${wallets.length} wallets and registered ${wallets.length} workers`,
        });

        logger.info(`Simulation ${simulation.id}: ${wallets.length} wallets generated`);
      } catch (err) {
        logger.error('Simulation wallet generation failed', { err });
        await prisma.simulationRun.update({
          where: { id: simulation.id },
          data: { status: 'FAILED' },
        });
      }
    });

    res.status(201).json({ success: true, data: simulation });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Start simulation error', { err });
    res.status(500).json({ error: 'Failed to start simulation' });
  }
});

// ─── GET /api/simulation ───────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const simulations = await prisma.simulationRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: { _count: { select: { wallets: true } } },
    });
    res.json({ success: true, data: simulations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
});

// ─── GET /api/simulation/:id ───────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sim = await prisma.simulationRun.findUnique({
      where: { id: req.params.id },
      include: {
        wallets: { orderBy: { earnings: 'desc' }, take: 100 },
      },
    });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });
    res.json({ success: true, data: sim });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
});

// ─── GET /api/simulation/queues/stats ──────────────────────────────────────────
router.get('/queues/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getQueueStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queue stats' });
  }
});

export default router;
