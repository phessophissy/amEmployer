'use client';
import { useState } from 'react';
import { useWalletContext } from '@/components/common/WalletProvider';
import { SectionHeader } from '@/components/common/SectionHeader';
export default function WorkerRegisterPage() {
  const { address, isConnected, connect } = useWalletContext();
  const [personaName, setPersonaName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  if (!isConnected) return (
    <div className="max-w-sm mx-auto px-4 py-16 text-center">
      <p className="text-slate-400 mb-4">Connect your wallet to register as a worker</p>
      <button onClick={connect} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">Connect Wallet</button>
    </div>
  );
  if (submitted) return (
    <div className="max-w-sm mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4">🎉</div>
      <h2 className="text-xl font-bold text-white mb-2">Welcome, {personaName || 'Worker'}!</h2>
      <p className="text-slate-500 text-sm">Your profile is set up. Start completing tasks to earn cUSD.</p>
    </div>
  );
  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      <SectionHeader title="Register as Worker" subtitle="Set up your worker profile" />
      <div className="space-y-4">
        <div>
          <label className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1.5">Display Name</label>
          <input value={personaName} onChange={e => setPersonaName(e.target.value)} placeholder="e.g. DataLabeler_42"
            className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 outline-none transition-colors" />
        </div>
        <div>
          <label className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1.5">Wallet Address</label>
          <div className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 break-all">{address}</div>
        </div>
        <button onClick={() => setSubmitted(true)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
          Register &amp; Start Earning
        </button>
      </div>
    </div>
  );
}
