'use client';
interface AmountInputProps { value: string; onChange: (v: string) => void; currency?: string; presets?: string[]; }
const DEFAULT_PRESETS = ['1','5','10','25','50','100'];
export function AmountInput({ value, onChange, currency = 'cUSD', presets = DEFAULT_PRESETS }: AmountInputProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <input type="number" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00"
          className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-4 text-2xl font-bold font-mono text-slate-200 placeholder-slate-700 outline-none transition-colors text-center" />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-emerald-400">{currency}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {presets.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={"py-2.5 text-sm font-mono rounded-xl border transition-all " + (value === p ? 'bg-emerald-500 border-emerald-500 text-black font-bold' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-500/40')}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
