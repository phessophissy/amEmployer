'use client';
const MODELS = [
  { id: 'claude-3-haiku', label: 'Claude Haiku', desc: 'Fast, efficient', badge: 'DEFAULT', color: 'emerald' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Cost effective', badge: '', color: 'cyan' },
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'Most capable', badge: 'PREMIUM', color: 'purple' },
];
interface AIModelSelectorProps { value: string; onChange: (v: string) => void; }
export function AIModelSelector({ value, onChange }: AIModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-mono text-slate-500 uppercase tracking-wider">AI Model</label>
      <div className="grid gap-2">
        {MODELS.map(m => (
          <button key={m.id} onClick={() => onChange(m.id)}
            className={"flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all " + (value === m.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600')}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">{m.label}</span>
                {m.badge && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">{m.badge}</span>}
              </div>
              <p className="text-xs text-slate-500">{m.desc}</p>
            </div>
            {value === m.id && <span className="text-emerald-400">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
