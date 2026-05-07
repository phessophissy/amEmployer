import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import logger from '../lib/logger';

let io: SocketServer;

export function initWebSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    socket.on('subscribe:simulation', (simulationId: string) => {
      socket.join(`simulation:${simulationId}`);
    });

    socket.on('subscribe:jobs', () => {
      socket.join('jobs');
    });

    socket.on('subscribe:ai-logs', () => {
      socket.join('ai-logs');
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Broadcast helpers used throughout the codebase
export function broadcast(event: string, data: unknown) {
  if (!io) return;
  io.emit(event, data);
}

export function broadcastToRoom(room: string, event: string, data: unknown) {
  if (!io) return;
  io.to(room).emit(event, data);
}

export function broadcastAILog(log: {
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  broadcast('ai:log', { ...log, timestamp: new Date().toISOString() });
  broadcastToRoom('ai-logs', 'ai:log', { ...log, timestamp: new Date().toISOString() });
}

export function broadcastTaskUpdate(task: unknown) {
  broadcast('task:update', task);
}

export function broadcastSimulationUpdate(simulationId: string, data: unknown) {
  broadcastToRoom(`simulation:${simulationId}`, 'simulation:update', data);
  broadcast('simulation:update', data);
}

export function broadcastPayment(payment: unknown) {
  broadcast('payment:new', payment);
}

export function getIO(): SocketServer {
  return io;
}
