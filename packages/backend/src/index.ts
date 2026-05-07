import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { initWebSocket } from './websocket';
import { initQueues } from './services/queue/taskQueue';
import logger from './lib/logger';

const PORT = parseInt(process.env.PORT || '4000', 10);

const httpServer = createServer(app);
const io = initWebSocket(httpServer);

// Attach io to app for use in routes
app.set('io', io);

async function bootstrap() {
  try {
    await initQueues();
    logger.info('✅ Queue workers initialized');

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
