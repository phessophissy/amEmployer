import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { blockchain } from '../services/blockchain';

const router = Router();

// ─── GET /api/stats — platform-wide stats ─────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [
      totalJobs,
      activeJobs,
      totalTasks,
      openTasks,
      assignedTasks,
      submittedTasks,
      verifiedTasks,
      paidTasks,
      totalWorkers,
      activeWorkers,
      totalPayments,
      recentPayments,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'ACTIVE' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'OPEN' } }),
      prisma.task.count({ where: { status: 'ASSIGNED' } }),
      prisma.task.count({ where: { status: 'SUBMITTED' } }),
      prisma.task.count({ where: { status: 'VERIFIED' } }),
      prisma.task.count({ where: { status: 'PAID' } }),
      prisma.worker.count(),
      prisma.worker.count({ where: { isActive: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          task: { select: { title: true } },
          worker: { select: { walletAddress: true, personaName: true } },
        },
      }),
    ]);

    let onchainStats = { totalTasks: 0, completedTasks: 0, paidOut: '0' };
    try {
      onchainStats = await blockchain.getPlatformStats();
    } catch {}

    res.json({
      success: true,
      data: {
        jobs: { total: totalJobs, active: activeJobs },
        tasks: {
          total: totalTasks,
          open: openTasks,
          assigned: assignedTasks,
          submitted: submittedTasks,
          verified: verifiedTasks,
          paid: paidTasks,
        },
        workers: { total: totalWorkers, active: activeWorkers },
        payments: {
          totalAmount: totalPayments._sum.amount?.toString() || '0',
          recent: recentPayments,
        },
        onchain: onchainStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
});

// ─── GET /api/stats/activity — time-series for charts ─────────────────────────
router.get('/activity', async (_req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: since }, status: 'CONFIRMED' },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group into hourly buckets
    const buckets: Record<string, { count: number; amount: number }> = {};
    payments.forEach((p: { createdAt: Date; amount: { toString(): string } }) => {
      const hour = new Date(p.createdAt);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      if (!buckets[key]) buckets[key] = { count: 0, amount: 0 };
      buckets[key].count++;
      buckets[key].amount += parseFloat(p.amount.toString());
    });

    const series = Object.entries(buckets).map(([time, data]) => ({ time, ...data }));
    res.json({ success: true, data: series });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

export default router;
