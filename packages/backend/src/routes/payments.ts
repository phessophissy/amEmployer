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

// ─── GET /api/payments/summary ─────────────────────────────────────────────
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const [total, confirmed, pending, failed, agg] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'CONFIRMED' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'CONFIRMED' } }),
    ]);
    res.json({
      success: true,
      data: {
        total, confirmed, pending, failed,
        totalAmountPaid: (Number(agg._sum.amount) ?? 0).toFixed(18),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

// ─── GET /api/payments/daily ───────────────────────────────────────────────
router.get('/daily', async (req: Request, res: Response) => {
  try {
    const { days = '7' } = req.query;
    const since = new Date(Date.now() - parseInt(String(days)) * 86_400_000);
    const payments = await prisma.payment.findMany({
      where: { status: 'CONFIRMED', createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const daily = new Map<string, number>();
    for (const p of payments) {
      const day = p.createdAt.toISOString().slice(0, 10);
      daily.set(day, (daily.get(day) ?? 0) + Number(p.amount));
    }
    const data = Array.from(daily.entries()).map(([date, amount]) => ({ date, amount }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily payments' });
  }
});
