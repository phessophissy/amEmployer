interface SimulationMetrics {
  startTime: number;
  walletsGenerated: number;
  walletsFunded: number;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksRetried: number;
  totalPaidOut: number;
  txHashes: string[];
  errors: Array<{ time: number; message: string }>;
  completionTimes: number[]; // ms per task
}

export class MetricsCollector {
  private metrics: SimulationMetrics;
  private printInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.metrics = {
      startTime: Date.now(),
      walletsGenerated: 0,
      walletsFunded: 0,
      tasksAssigned: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksRetried: 0,
      totalPaidOut: 0,
      txHashes: [],
      errors: [],
      completionTimes: [],
    };
  }

  record(event: Partial<SimulationMetrics>) {
    Object.assign(this.metrics, {
      walletsGenerated: (this.metrics.walletsGenerated + (event.walletsGenerated || 0)),
      walletsFunded: (this.metrics.walletsFunded + (event.walletsFunded || 0)),
      tasksAssigned: (this.metrics.tasksAssigned + (event.tasksAssigned || 0)),
      tasksCompleted: (this.metrics.tasksCompleted + (event.tasksCompleted || 0)),
      tasksFailed: (this.metrics.tasksFailed + (event.tasksFailed || 0)),
      tasksRetried: (this.metrics.tasksRetried + (event.tasksRetried || 0)),
      totalPaidOut: (this.metrics.totalPaidOut + (event.totalPaidOut || 0)),
    });
  }

  recordCompletionTime(ms: number) {
    this.metrics.completionTimes.push(ms);
  }

  recordError(message: string) {
    this.metrics.errors.push({ time: Date.now(), message });
  }

  recordTx(hash: string) {
    this.metrics.txHashes.push(hash);
  }

  getSnapshot() {
    const elapsed = (Date.now() - this.metrics.startTime) / 1000;
    const avgCompletionMs =
      this.metrics.completionTimes.length
        ? this.metrics.completionTimes.reduce((a, b) => a + b, 0) / this.metrics.completionTimes.length
        : 0;
    const tps = elapsed > 0 ? this.metrics.tasksCompleted / elapsed : 0;

    return {
      ...this.metrics,
      elapsedSeconds: elapsed,
      avgCompletionMs: Math.round(avgCompletionMs),
      tps: tps.toFixed(3),
      successRate:
        this.metrics.tasksAssigned > 0
          ? ((this.metrics.tasksCompleted / this.metrics.tasksAssigned) * 100).toFixed(1)
          : '0.0',
    };
  }

  print() {
    const snap = this.getSnapshot();
    console.clear();
    console.log('═'.repeat(60));
    console.log('  amEmployer — Simulation Dashboard');
    console.log('═'.repeat(60));
    console.log(`  Elapsed:        ${snap.elapsedSeconds.toFixed(1)}s`);
    console.log(`  Wallets:        ${snap.walletsGenerated} generated | ${snap.walletsFunded} funded`);
    console.log(`  Tasks Assigned: ${snap.tasksAssigned}`);
    console.log(`  Tasks Done:     ${snap.tasksCompleted} ✅`);
    console.log(`  Tasks Failed:   ${snap.tasksFailed} ❌`);
    console.log(`  Retried:        ${snap.tasksRetried}`);
    console.log(`  Total Paid:     ${snap.totalPaidOut.toFixed(4)} cUSD`);
    console.log(`  Avg Completion: ${snap.avgCompletionMs}ms`);
    console.log(`  Est. TPS:       ${snap.tps}`);
    console.log(`  Success Rate:   ${snap.successRate}%`);
    console.log(`  Tx Count:       ${snap.txHashes.length}`);
    if (snap.errors.length > 0) {
      console.log(`\n  Recent Errors:`);
      snap.errors.slice(-3).forEach((e) => console.log(`    - ${e.message}`));
    }
    console.log('═'.repeat(60));
  }

  startPrinting(intervalMs = 2000) {
    this.printInterval = setInterval(() => this.print(), intervalMs);
  }

  stopPrinting() {
    if (this.printInterval) {
      clearInterval(this.printInterval);
      this.printInterval = null;
    }
  }

  printFinal() {
    this.stopPrinting();
    this.print();
    const snap = this.getSnapshot();
    console.log('\n📊 Final Report:');
    console.log(JSON.stringify(snap, null, 2));
  }
}
