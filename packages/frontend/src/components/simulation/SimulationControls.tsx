'use client';
import { useState } from 'react';

interface SimulationControlsProps {
  onLaunch: (config: SimConfig) => Promise<void>;
  running: boolean;
}
interface SimConfig { workerCount: number; jobCount: number; mode: 'standard' | 'stress' | 'custom'; }
const PRESETS = [
  { label: 'Quick', config: { workerCount: 5, jobCount: 2, mode: 'standard' as const } },
  { label: 'Standard', config: { workerCount: 20, jobCount: 5, mode: 'standard' as const } },
  { label: 'Stress', config: { workerCount: 100, jobCount: 10, mode: 'stress' as const } },
];
export function SimulationControls({ onLaunch, running }: SimulationControlsProps) {
  const [config, setConfig] = useState<SimConfig>({ workerCount: 20, jobCount: 5, mode: 'standard' });
  return (
    <div className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-5 space-y-5">
      <h3 className="font-semibold text-slate-200 text-sm">Simulation Config</h3>
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => setConfig(p.config)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${JSON.stringify(config) === JSON.stringify(p.config) ? 'bg-emerald-500 border-emerald-500 text-black font-bold' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-500/40'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono text-slate-500 mb-1.5 block">Workers: {config.workerCount}</label>
          <input type="range" min={1} max={100} value={config.workerCount} onChange={e => setConfig(c => ({ ...c, workerCount: +e.target.value }))}
            className="w-full accent-emerald-500" />
        </div>
        <div>
          <label className="text-xs font-mono text-slate-500 mb-1.5 block">Jobs: {config.jobCount}</label>
          <input type="range" min={1} max={20} value={config.jobCount} onChange={e => setConfig(c => ({ ...c, jobCount: +e.target.value }))}
            className="w-full accent-emerald-500" />
        </div>
      </div>
      <button onClick={() => onLaunch(config)} disabled={running}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-lg">
        {running ? '⚡ Simulation Running…' : '⚡ Launch Simulation'}
      </button>
    </div>
  );
}
