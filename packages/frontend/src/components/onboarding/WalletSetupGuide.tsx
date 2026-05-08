'use client';
const STEPS = [
  { step: 1, title: 'Install MiniPay', desc: 'Download Opera MiniPay from the App Store or Google Play.' },
  { step: 2, title: 'Open amEmployer', desc: 'Navigate to this URL inside MiniPay browser.' },
  { step: 3, title: 'Auto-connect', desc: 'MiniPay auto-connects your wallet — no extra steps needed.' },
  { step: 4, title: 'Start Earning', desc: 'Browse jobs, complete tasks, and receive cUSD instantly.' },
];
export function WalletSetupGuide() {
  return (
    <div className="space-y-3">
      {STEPS.map(s => (
        <div key={s.step} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold font-mono text-emerald-400 flex-shrink-0 mt-0.5">{s.step}</div>
          <div>
            <p className="text-sm font-semibold text-slate-200">{s.title}</p>
            <p className="text-xs text-slate-500">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
