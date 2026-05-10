import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { initWebSocket } from './websocket';
import { initQueues, decompositionQueue } from './services/queue/taskQueue';
import prisma from './lib/prisma';
import logger from './lib/logger';

const PORT = parseInt(process.env.PORT || '4000', 10);

const httpServer = createServer(app);
const io = initWebSocket(httpServer);

// Attach io to app for use in routes
app.set('io', io);

/**
 * Re-enqueue any PENDING jobs that were saved to DB but never made it into
 * Redis (e.g. because Redis was down at creation time).
 */
async function requeueStalePendingJobs() {
  try {
    const stale = await prisma.job.findMany({ where: { status: 'PENDING' } });
    if (stale.length === 0) return;
    logger.info(`Re-enqueuing ${stale.length} stale PENDING job(s)…`);
    for (const job of stale) {
      await decompositionQueue.add('decompose', { jobId: job.id }).catch(() => {});
    }
  } catch (err) {
    logger.warn('Could not re-enqueue stale jobs (Redis may still be starting)', { err });
  }
}

async function bootstrap() {
  try {
    await initQueues();
    logger.info('✅ Queue workers initialized');

    // Give Redis a moment to settle, then recover any missed jobs
    setTimeout(requeueStalePendingJobs, 5000);

    httpServer.listen(PORT, () => {
      logger.info(`🚀 amEmployer backend running on port ${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV}`);
      logger.info(`   AI Provider: ${process.env.AI_PROVIDER || 'mock'}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
