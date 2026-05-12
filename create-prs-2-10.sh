#!/bin/bash
set -e
REPO="phessophissy/amEmployer"
cd /home/thee1/amEmployer

# Helper: append routes to app.ts using Python (before export default)
add_route_to_app() {
  local import_line="$1"
  local use_line="$2"
  python3 - "$import_line" "$use_line" << 'PYEOF'
import sys, pathlib
import_line, use_line = sys.argv[1], sys.argv[2]
p = pathlib.Path('packages/backend/src/app.ts')
content = p.read_text()
if import_line.split(' ')[2] in content:
    print("Route already registered"); sys.exit(0)
# Insert import after last existing import line
import_idx = content.rfind("import ")
nl = content.index('\n', import_idx)
content = content[:nl+1] + import_line + '\n' + content[nl+1:]
# Insert app.use before "export default app;"
content = content.replace("export default app;", use_line + "\nexport default app;")
p.write_text(content)
print("Updated app.ts")
PYEOF
}

# ══════════════════════════════════════════════════════════════════════════════
# PR 2 — feat/sdk-utilities
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/sdk-utilities

# Commit 1 — scaffold sdk package
mkdir -p packages/sdk/src/utils
cat > packages/sdk/package.json << 'EOF'
{
  "name": "@amemployer/sdk",
  "version": "0.1.0",
  "description": "amEmployer SDK utility helpers",
  "main": "src/index.ts",
  "scripts": { "build": "tsup src/index.ts --format cjs,esm --dts" },
  "devDependencies": { "tsup": "^8.0.0", "typescript": "^5.0.0" },
  "peerDependencies": { "ethers": "^6.0.0" }
}
EOF
cat > packages/sdk/src/index.ts << 'EOF'
// amEmployer SDK — utility helpers
export * from './utils';
EOF
git add -A && git commit -m "feat(sdk): scaffold packages/sdk with utility-first entry point"

# Commit 2
cat > packages/sdk/src/utils/format.ts << 'EOF'
/**
 * Format a bigint wei value to a human-readable decimal string.
 * Uses pure math — no ethers dependency required for display.
 */
export function formatUnits(value: bigint, decimals = 18): string {
  const str = value.toString().padStart(decimals + 1, '0');
  const intPart = str.slice(0, str.length - decimals) || '0';
  const fracPart = str.slice(str.length - decimals).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/** Format wei as a cUSD string e.g. "10.50 cUSD" */
export function formatCUSD(wei: bigint, decimals = 18): string {
  const raw = formatUnits(wei, decimals);
  const [int, frac = ''] = raw.split('.');
  return `${int}.${frac.slice(0, 2).padEnd(2, '0')} cUSD`;
}

/** Format a Unix timestamp (seconds) to locale date string */
export function formatTimestamp(unixSeconds: bigint | number): string {
  return new Date(Number(unixSeconds) * 1000).toLocaleString();
}

/** Format a reputation score 0–100 with a label */
export function formatReputation(score: number): string {
  if (score >= 80) return `${score}/100 ★★★★★`;
  if (score >= 60) return `${score}/100 ★★★★`;
  if (score >= 40) return `${score}/100 ★★★`;
  return `${score}/100 ★★`;
}
EOF
git add -A && git commit -m "feat(sdk): add format utilities (formatCUSD, formatTimestamp, formatReputation)"

# Commit 3
cat > packages/sdk/src/utils/hash.ts << 'EOF'
/** Encode a string to a fixed 32-byte hex (right-padded with nulls). */
export function toBytes32(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input.slice(0, 32));
  const padded = new Uint8Array(32);
  padded.set(bytes);
  return '0x' + Array.from(padded).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Decode a 0x-prefixed bytes32 hex string to a UTF-8 string (strips null bytes). */
export function fromBytes32(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  return new TextDecoder().decode(bytes).replace(/\0/g, '');
}
EOF
git add -A && git commit -m "feat(sdk): add bytes32 encode/decode utilities (toBytes32, fromBytes32)"

# Commit 4
cat > packages/sdk/src/utils/address.ts << 'EOF'
/** Returns true if the string looks like a valid 20-byte Ethereum address. */
export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/** Returns the zero address constant. */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Returns true if the address is the zero address. */
export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
}

/** Shorten an address for display: 0x1234...abcd */
export function shortenAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
EOF
git add -A && git commit -m "feat(sdk): add address validation utilities (isValidAddress, shortenAddress)"

# Commit 5
cat > packages/sdk/src/utils/index.ts << 'EOF'
export * from './format';
export * from './hash';
export * from './address';
EOF
git add -A && git commit -m "feat(sdk): add utils barrel; SDK fully importable from packages/sdk/src/index.ts"

git push -u origin feat/sdk-utilities
gh pr create --repo "$REPO" --base main --head feat/sdk-utilities \
  --title "feat(sdk): add utility helpers (format, hash, address)" \
  --body "Scaffolds \`packages/sdk\` with zero-dependency utility helpers: \`formatCUSD\`, \`formatTimestamp\`, \`toBytes32\`/\`fromBytes32\`, \`isValidAddress\`, \`shortenAddress\`, and \`formatReputation\`."
git checkout main

# ══════════════════════════════════════════════════════════════════════════════
# PR 3 — feat/backend-worker-search
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/backend-worker-search

cat >> packages/backend/src/routes/workers.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/workers/search endpoint"

cat >> packages/backend/src/routes/workers.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/workers/top-earners endpoint"

cat >> packages/backend/src/routes/workers.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/workers/by-type/:type endpoint"

cat >> packages/backend/src/routes/workers.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/workers/:address/tasks endpoint"

cat >> packages/backend/src/routes/workers.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/workers/:address/earnings endpoint"

git push -u origin feat/backend-worker-search
gh pr create --repo "$REPO" --base main --head feat/backend-worker-search \
  --title "feat(backend): add worker search, top-earners, by-type, tasks and earnings endpoints" \
  --body "Extends the workers API with full-text search, top earners leaderboard, type-based filtering, per-worker task list, and earnings history."
git checkout main

# ══════════════════════════════════════════════════════════════════════════════
# PR 4 — feat/backend-job-stats
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/backend-job-stats

cat >> packages/backend/src/routes/jobs.ts << 'EOF'

// ─── GET /api/jobs/active ──────────────────────────────────────────────────
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true } } },
    });
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active jobs' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/jobs/active — active jobs listing"

cat >> packages/backend/src/routes/jobs.ts << 'EOF'

// ─── GET /api/jobs/:id/stats ───────────────────────────────────────────────
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params.id);
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      where: { jobId },
      _count: { status: true },
    });
    const tasksByStatus = Object.fromEntries(
      taskCounts.map((t) => [t.status, t._count.status])
    );
    res.json({ success: true, data: { jobId, tasksByStatus } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job stats' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/jobs/:id/stats — task breakdown by status"

cat >> packages/backend/src/routes/jobs.ts << 'EOF'

// ─── GET /api/jobs/:id/payments ────────────────────────────────────────────
router.get('/:id/payments', async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params.id);
    const payments = await prisma.payment.findMany({
      where: { task: { jobId } },
      include: {
        task: { select: { title: true, reward: true } },
        worker: { select: { walletAddress: true, personaName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const total = payments.reduce((s, p) => s + Number(p.amount), 0);
    res.json({ success: true, data: { payments, totalPaid: total.toFixed(18) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job payments' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/jobs/:id/payments — per-job payment list"

cat >> packages/backend/src/routes/jobs.ts << 'EOF'

// ─── GET /api/jobs/:id/workers ─────────────────────────────────────────────
router.get('/:id/workers', async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params.id);
    const tasks = await prisma.task.findMany({
      where: { jobId, assignedWorker: { not: null } },
      select: { assignedWorker: true, status: true, validationScore: true },
    });
    const workerMap = new Map<string, { tasks: number; totalScore: number }>();
    for (const t of tasks) {
      if (!t.assignedWorker) continue;
      const e = workerMap.get(t.assignedWorker) ?? { tasks: 0, totalScore: 0 };
      e.tasks++;
      if (t.validationScore) e.totalScore += t.validationScore;
      workerMap.set(t.assignedWorker, e);
    }
    const workers = Array.from(workerMap.entries()).map(([address, s]) => ({
      address,
      taskCount: s.tasks,
      avgScore: s.tasks > 0 ? (s.totalScore / s.tasks).toFixed(2) : '0.00',
    }));
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job workers' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/jobs/:id/workers — assigned workers per job"

cat >> packages/backend/src/routes/jobs.ts << 'EOF'

// ─── GET /api/jobs/:id/completion-rate ────────────────────────────────────
router.get('/:id/completion-rate', async (req: Request, res: Response) => {
  try {
    const jobId = String(req.params.id);
    const [total, paid, rejected] = await Promise.all([
      prisma.task.count({ where: { jobId } }),
      prisma.task.count({ where: { jobId, status: 'PAID' } }),
      prisma.task.count({ where: { jobId, status: 'REJECTED' } }),
    ]);
    const rate = total > 0 ? ((paid / total) * 100).toFixed(1) : '0.0';
    res.json({ success: true, data: { total, paid, rejected, completionRate: `${rate}%` } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate completion rate' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/jobs/:id/completion-rate endpoint"

git push -u origin feat/backend-job-stats
gh pr create --repo "$REPO" --base main --head feat/backend-job-stats \
  --title "feat(backend): add job stats, payments, workers, active listing and completion-rate" \
  --body "Expands the jobs API with per-job analytics: active listing, task status breakdown, payments, assigned workers with avg scores, and completion rate."
git checkout main

# ══════════════════════════════════════════════════════════════════════════════
# PR 5 — feat/backend-task-filters
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/backend-task-filters

cat >> packages/backend/src/routes/tasks.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/tasks/stats — counts by status"

cat >> packages/backend/src/routes/tasks.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/tasks/high-reward — tasks sorted by reward"

cat >> packages/backend/src/routes/tasks.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/tasks/expiring-soon — deadline-aware filter"

cat >> packages/backend/src/routes/tasks.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/tasks/recent-completions — latest paid tasks feed"

cat >> packages/backend/src/routes/tasks.ts << 'EOF'

// ─── GET /api/tasks/:id/history ────────────────────────────────────────────
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: String(req.params.id) },
      include: {
        payments: { orderBy: { createdAt: 'asc' } },
        job: { select: { title: true, employerAddress: true } },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task history' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/tasks/:id/history — task detail with payment timeline"

git push -u origin feat/backend-task-filters
gh pr create --repo "$REPO" --base main --head feat/backend-task-filters \
  --title "feat(backend): add task stats, high-reward, expiring-soon, completions and history" \
  --body "Extends the tasks API with aggregate stats, high-reward listing, expiring-soon alerts, recent completions feed, and per-task payment history."
git checkout main

# ══════════════════════════════════════════════════════════════════════════════
# PR 6 — feat/backend-request-id
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/backend-request-id

mkdir -p packages/backend/src/middleware
cat > packages/backend/src/middleware/requestId.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { id: string }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.id = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
}
EOF
git add -A && git commit -m "feat(backend): add requestId middleware — UUID per request, echoed in response header"

cat > packages/backend/src/middleware/notFound.ts << 'EOF'
import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
}
EOF
git add -A && git commit -m "feat(backend): add 404 not-found handler with requestId in response"

cat > packages/backend/src/middleware/errorHandler.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error('Unhandled error', {
    requestId: req.id,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    requestId: req.id,
  });
}
EOF
git add -A && git commit -m "feat(backend): add typed global error handler middleware"

cat > packages/backend/src/middleware/cors.ts << 'EOF'
import cors from 'cors';

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((o) => o.trim());

export const corsMiddleware = cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86_400,
});
EOF
git add -A && git commit -m "feat(backend): add configurable CORS middleware with X-Request-ID support"

cat > packages/backend/src/middleware/index.ts << 'EOF'
export { requestIdMiddleware } from './requestId';
export { notFoundHandler } from './notFound';
export { globalErrorHandler } from './errorHandler';
export { corsMiddleware } from './cors';
EOF
git add -A && git commit -m "feat(backend): add middleware barrel export"

git push -u origin feat/backend-request-id
gh pr create --repo "$REPO" --base main --head feat/backend-request-id \
  --title "feat(backend): add request-id, not-found, error-handler and CORS middleware" \
  --body "Introduces a structured middleware layer: UUID-based request tracking, typed 404/500 responses, and environment-configurable CORS with \`X-Request-ID\` header propagation."
git checkout main

# ══════════════════════════════════════════════════════════════════════════════
# PR 7 — feat/backend-payment-summary
# ══════════════════════════════════════════════════════════════════════════════
git checkout main
git checkout -b feat/backend-payment-summary

cat > packages/backend/src/routes/payments.ts << 'EOF'
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
EOF
git add -A && git commit -m "feat(backend): scaffold GET /api/payments with worker + status filters"

cat >> packages/backend/src/routes/payments.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/payments/summary — aggregate totals"

cat >> packages/backend/src/routes/payments.ts << 'EOF'

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
EOF
git add -A && git commit -m "feat(backend): add GET /api/payments/daily — day-by-day aggregation"

cat >> packages/backend/src/routes/payments.ts << 'EOF'

// ─── GET /api/payments/:id ─────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: String(req.params.id) },
      include: {
        task: { include: { job: { select: { title: true } } } },
        worker: { select: { walletAddress: true, personaName: true, reputation: true } },
      },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});
EOF
git add -A && git commit -m "feat(backend): add GET /api/payments/:id — single payment detail"

# Commit 5 — register in app.ts
add_route_to_app \
  "import paymentsRouter from './routes/payments';" \
  "app.use('/api/payments', paymentsRouter);"
git add -A && git commit -m "feat(backend): register payments router in app.ts"

git push -u origin feat/backend-payment-summary
gh pr create --repo "$REPO" --base main --head feat/backend-payment-summary \
  --title "feat(backend): add /api/payments — listing, summary, daily and detail" \
  --body "Introduces a dedicated payments router with paginated list, aggregate summary, daily breakdown by day, and single-payment detail endpoint."
git checkout main

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
      return res.status(400).json({ error: `Cannot stop a simulation with status: ${sim.status}` });
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
      data: { id: sim.id, status: sim.status, walletCount: wallets.length, totalEarnings: totalEarnings.toFixed(18), avgEarnings: avgEarnings.toFixed(18), totalTasks },
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
// amEmployer SDK — event helpers, constants, and utilities
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
add_route_to_app \
  "import aiLogsRouter from './routes/aiLogs';" \
  "app.use('/api/ai-logs', aiLogsRouter);"
git add -A && git commit -m "feat(backend): register ai-logs router in app.ts"

git push -u origin feat/backend-ai-logs-route
gh pr create --repo "$REPO" --base main --head feat/backend-ai-logs-route \
  --title "feat(backend): add /api/ai-logs — listing, recent, errors and stats" \
  --body "Introduces a dedicated AI logs router with paginated list, recent feed, error filter, and log-type count stats."
git checkout main

echo ""
echo "✅ All 9 remaining PRs created!"
echo ""
gh pr list --repo "$REPO" --state open
