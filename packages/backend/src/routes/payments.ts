import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── GET /api/payments ─────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { worker, status, limit = '50', offset = '0' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = String(status);
    if (worker) {
      const w = await prisma.worker.findUnique({ where: { walletAddress: String(worker) } });
      if (w) where.workerId = w.id;
    }
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(String(limit)), 200),
        skip: parseInt(String(offset)),
        include: {
          task: { select: { title: true } },
          worker: { select: { walletAddress: true, personaName: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    res.json({ success: true, data: payments, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router;
