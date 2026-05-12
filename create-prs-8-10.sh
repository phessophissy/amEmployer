#!/bin/bash
set -e
REPO="phessophissy/amEmployer"
cd /home/thee1/amEmployer

# ══════════════════════════════════════════════════════════════════════════════
# PR 8 — feat/backend-simulation-extras
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/backend-simulation-extras

cat >> packages/backend/src/routes/simulation.ts << 'EOF'

// ─── GET /api/simulation/summary ──────────────────────────────────────────
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const sims = await prisma.simulationRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, status: true, walletCount: true, createdAt: true },
    });
    res.json({ success: true, data: sims });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch simulation summary' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/simulation/summary — recent runs list"

cat >> packages/backend/src/routes/simulation.ts << 'EOF'

// ─── GET /api/simulation/:id/wallets ─────────────────────────────────────
router.get('/:id/wallets', async (req: Request, res: Response) => {
  try {
    const sim = await prisma.simulationRun.findUnique({ where: { id: String(req.params.id) } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });
    const wallets = await prisma.simulationWallet.findMany({
      where: { simulationRunId: sim.id },
      orderBy: { earnings: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: wallets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch simulation wallets' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/simulation/:id/wallets — wallet list per run"

cat >> packages/backend/src/routes/simulation.ts << 'EOF'

// ─── POST /api/simulation/:id/stop ────────────────────────────────────────
router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const sim = await prisma.simulationRun.findUnique({ where: { id: String(req.params.id) } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });
    if (sim.status !== 'RUNNING') {
      return res.status(400).json({ error: `Cannot stop simulation with status: ${sim.status}` });
    }
    const updated = await prisma.simulationRun.update({
      where: { id: sim.id },
      data: { status: 'PAUSED' },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop simulation' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add POST /api/simulation/:id/stop — pause a running simulation"

cat >> packages/backend/src/routes/simulation.ts << 'EOF'

// ─── GET /api/simulation/:id/stats ────────────────────────────────────────
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const sim = await prisma.simulationRun.findUnique({ where: { id: String(req.params.id) } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });
    const wallets = await prisma.simulationWallet.findMany({
      where: { simulationRunId: sim.id },
      select: { earnings: true, completedTasks: true },
    });
    const totalEarnings = wallets.reduce((s, w) => s + Number(w.earnings), 0);
    const totalTasks = wallets.reduce((s, w) => s + w.completedTasks, 0);
    const avgEarnings = wallets.length > 0 ? totalEarnings / wallets.length : 0;
    res.json({
      success: true,
      data: {
        id: sim.id, status: sim.status,
        walletCount: wallets.length,
        totalEarnings: totalEarnings.toFixed(18),
        avgEarnings: avgEarnings.toFixed(18),
        totalTasks,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch simulation stats' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/simulation/:id/stats — earnings and task totals"

cat >> packages/backend/src/routes/simulation.ts << 'EOF'

// ─── GET /api/simulation/:id/top-earners ──────────────────────────────────
router.get('/:id/top-earners', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const sim = await prisma.simulationRun.findUnique({ where: { id: String(req.params.id) } });
    if (!sim) return res.status(404).json({ error: 'Simulation not found' });
    const wallets = await prisma.simulationWallet.findMany({
      where: { simulationRunId: sim.id },
      orderBy: { earnings: 'desc' },
      take: Math.min(parseInt(String(limit)), 50),
      select: { address: true, earnings: true, completedTasks: true, workerType: true },
    });
    res.json({ success: true, data: wallets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top earners' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/simulation/:id/top-earners — ranked wallets"

git push -u origin feat/backend-simulation-extras
gh pr create --repo "$REPO" --base main --head feat/backend-simulation-extras \
  --title "feat(backend): add simulation summary, wallets, stop, stats and top-earners" \
  --body "Extends the simulation API with a summary listing, per-run wallet list, stop action (RUNNING→PAUSED), stats breakdown, and top-earners leaderboard."
git checkout main

# ══════════════════════════════════════════════════════════════════════════════
# PR 9 — feat/sdk-event-helpers
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/sdk-event-helpers

mkdir -p packages/sdk/src/constants packages/sdk/src/utils

cat > packages/sdk/src/constants/labels.ts << 'EOF'
/** Map on-chain task status index to a human-readable label. */
export const TASK_STATUS_LABELS: Record<number, string> = {
  0: 'OPEN',
  1: 'ASSIGNED',
  2: 'SUBMITTED',
  3: 'VERIFIED',
  4: 'REJECTED',
  5: 'PAID',
};

/** Map on-chain worker type index to a human-readable label. */
export const WORKER_TYPE_LABELS: Record<number, string> = {
  0: 'HUMAN',
  1: 'SCRIPTED',
  2: 'AI_AGENT',
};

export function taskStatusLabel(status: number): string {
  return TASK_STATUS_LABELS[status] ?? 'UNKNOWN';
}

export function workerTypeLabel(typeIndex: number): string {
  return WORKER_TYPE_LABELS[typeIndex] ?? 'UNKNOWN';
}
EOF
git add -A && git commit -m "feat(sdk): add TASK_STATUS_LABELS and WORKER_TYPE_LABELS constants"

cat > packages/sdk/src/utils/retry.ts << 'EOF'
/**
 * Retry an async function up to `maxAttempts` times with exponential back-off.
 * Useful for transient RPC errors when calling smart contracts.
 *
 * @example
 * const result = await withRetry(() => contract.getTask(id), 3, 500);
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 300,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
      }
    }
  }
  throw lastError;
}
EOF
git add -A && git commit -m "feat(sdk): add withRetry — exponential back-off for transient RPC errors"

cat > packages/sdk/src/utils/deadline.ts << 'EOF'
/** Returns true if the Unix timestamp (seconds) deadline has already passed. */
export function isDeadlinePassed(deadlineUnix: bigint | number): boolean {
  return Number(deadlineUnix) < Math.floor(Date.now() / 1000);
}

/** Returns seconds remaining until the deadline (negative if already passed). */
export function secondsUntilDeadline(deadlineUnix: bigint | number): number {
  return Number(deadlineUnix) - Math.floor(Date.now() / 1000);
}

/**
 * Format seconds remaining as a human-readable string.
 * Examples: "Expired", "45s", "12m", "3h", "2d"
 */
export function formatTimeRemaining(deadlineUnix: bigint | number): string {
  const secs = secondsUntilDeadline(deadlineUnix);
  if (secs <= 0) return 'Expired';
  if (secs < 60) return `${secs}s`;
  if (secs < 3_600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86_400) return `${Math.floor(secs / 3_600)}h`;
  return `${Math.floor(secs / 86_400)}d`;
}
EOF
git add -A && git commit -m "feat(sdk): add deadline utilities (isDeadlinePassed, formatTimeRemaining)"

cat > packages/sdk/src/utils/index.ts << 'EOF'
export * from './retry';
export * from './deadline';
EOF
git add -A && git commit -m "feat(sdk): add utils barrel (retry + deadline)"

cat > packages/sdk/src/index.ts << 'EOF'
// amEmployer SDK — status labels and utilities
export * from './constants/labels';
export * from './utils';
EOF
git add -A && git commit -m "feat(sdk): wire constants/labels and utils into main SDK entry point"

git push -u origin feat/sdk-event-helpers
gh pr create --repo "$REPO" --base main --head feat/sdk-event-helpers \
  --title "feat(sdk): add status labels, withRetry and deadline utilities" \
  --body "Adds \`TASK_STATUS_LABELS\`, \`WORKER_TYPE_LABELS\`, \`withRetry\` for resilient RPC calls, and deadline helpers (\`isDeadlinePassed\`, \`formatTimeRemaining\`)."
git checkout main

# ══════════════════════════════════════════════════════════════════════════════
# PR 10 — feat/backend-ai-logs-route
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/backend-ai-logs-route

cat > packages/backend/src/routes/aiLogs.ts << 'EOF'
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
EOF
git add -A && git commit -m "feat(backend): scaffold GET /api/ai-logs with type and jobId filters"

cat >> packages/backend/src/routes/aiLogs.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/ai-logs/recent — latest N entries"

cat >> packages/backend/src/routes/aiLogs.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/ai-logs/errors — error-only filter"

cat >> packages/backend/src/routes/aiLogs.ts << 'EOF'

// ─── GET /api/ai-logs/stats ───────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const counts = await prisma.aILog.groupBy({
      by: ['logType'],
      _count: { logType: true },
    });
    const data = Object.fromEntries(counts.map((c) => [c.logType, c._count.logType]));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI log stats' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/ai-logs/stats — counts grouped by log type"

# Commit 5 — register in app.ts
python3 << 'PYEOF'
import pathlib
p = pathlib.Path('packages/backend/src/app.ts')
content = p.read_text()
if 'aiLogsRouter' not in content:
    lines = content.split('\n')
    last_import = max(i for i, l in enumerate(lines) if l.strip().startswith('import '))
    lines.insert(last_import + 1, "import aiLogsRouter from './routes/aiLogs';")
    content = '\n'.join(lines)
    content = content.replace("export default app;", "app.use('/api/ai-logs', aiLogsRouter);\nexport default app;")
    p.write_text(content)
    print("Updated app.ts")
else:
    print("Already present")
PYEOF
git add -A && git commit -m "feat(backend): register ai-logs router in app.ts"

git push -u origin feat/backend-ai-logs-route
gh pr create --repo "$REPO" --base main --head feat/backend-ai-logs-route \
  --title "feat(backend): add /api/ai-logs — listing, recent, errors and stats" \
  --body "Introduces a dedicated AI logs router with paginated list, recent feed, error filter, and log-type count stats."
git checkout main

echo ""
echo "✅ All 10 PRs created!"
echo ""
gh pr list --repo "$REPO" --state open --limit 20
