/**
 * amEmployer — Simulation CLI entry point
 *
 * This starts a live simulation run via the backend API, then streams
 * real-time updates from the WebSocket to show progress in the terminal.
 *
 * Usage:
 *   npx ts-node src/index.ts [walletCount] [jobDescription]
 */
import 'dotenv/config';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const WS_URL   = process.env.NEXT_PUBLIC_WS_URL   || 'http://localhost:4000';

const walletCount   = parseInt(process.argv[2] || '20');
const jobDescription = process.argv[3] || 'Image labeling batch — label 500 product images for e-commerce platform';

async function main() {
  console.log('\n🤖 amEmployer — Autonomous AI Economy Simulation');
  console.log('━'.repeat(50));
  console.log(`  Wallets:  ${walletCount}`);
  console.log(`  Job:      ${jobDescription}`);
  console.log(`  API:      ${API_BASE}\n`);

  // Connect WebSocket for live updates
  const socket = io(WS_URL, { transports: ['websocket'] });

  socket.on('connect', () => console.log('✅ WebSocket connected\n'));
  socket.on('disconnect', () => console.log('\n⚡ WebSocket disconnected'));

  socket.on('ai:log', (data: any) => {
    const icon = { DECOMPOSITION: '🧠', VALIDATION: '✅', ERROR: '❌', PAYMENT_TRIGGER: '💸' }[data.type] || '📋';
    console.log(`${icon} [AI] ${data.message || JSON.stringify(data)}`);
  });

  socket.on('task:update', (data: any) => {
    console.log(`📋 Task ${data.taskId?.slice(0, 8)}: ${data.status}`);
  });

  socket.on('payment:new', (data: any) => {
    console.log(`💸 Payment: ${parseFloat(data.amount || '0').toFixed(4)} cUSD → ${data.workerAddress?.slice(0, 10)}...`);
  });

  socket.on('simulation:update', (data: any) => {
    const snap = data.stats || data;
    if (snap.completed !== undefined) {
      console.log(`\n📊 Simulation: ${snap.completed}/${snap.total} tasks | ${snap.paid || 0} paid`);
    }
  });

  // Join rooms
  socket.emit('join:jobs');
  socket.emit('join:ai-logs');

  // Start simulation
  try {
    console.log('\n🚀 Starting simulation...\n');

    const res = await axios.post(`${API_BASE}/api/simulation/start`, {
      walletCount,
      jobDescription,
      autoRun: true,
    });

    const simId = res.data.data?.id;
    if (simId) {
      console.log(`✅ Simulation started: ${simId}\n`);
      socket.emit('join:simulation', simId);
    }

    // Keep running until killed
    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => {
        console.log('\n\n⏹ Stopping simulation...');
        socket.disconnect();
        resolve();
      });
    });
  } catch (err: any) {
    console.error('Failed to start simulation:', err.response?.data?.message || err.message);
    socket.disconnect();
    process.exit(1);
  }
}

main();
