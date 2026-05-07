'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

interface AILogEntry {
  type: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface TaskUpdate {
  id: string;
  status: string;
  assignedWorker?: string;
  validationScore?: number;
}

interface PaymentEvent {
  taskId: string;
  worker: string;
  amount: number;
  txHash: string;
  timestamp: string;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [aiLogs, setAiLogs] = useState<AILogEntry[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([]);
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [simulationData, setSimulationData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe:ai-logs');
      socket.emit('subscribe:jobs');
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('ai:log', (log: AILogEntry) => {
      setAiLogs((prev) => [log, ...prev].slice(0, 200));
    });

    socket.on('task:update', (update: TaskUpdate) => {
      setTaskUpdates((prev) => [update, ...prev].slice(0, 100));
    });

    socket.on('payment:new', (payment: PaymentEvent) => {
      setPayments((prev) => [payment, ...prev].slice(0, 100));
    });

    socket.on('simulation:update', (data: Record<string, unknown>) => {
      setSimulationData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToSimulation = useCallback((simulationId: string) => {
    socketRef.current?.emit('subscribe:simulation', simulationId);
  }, []);

  return {
    connected,
    aiLogs,
    taskUpdates,
    payments,
    simulationData,
    subscribeToSimulation,
  };
}
