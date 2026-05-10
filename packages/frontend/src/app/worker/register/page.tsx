'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletContext } from '@/components/common/WalletProvider';
import { SectionHeader } from '@/components/common/SectionHeader';
import { api } from '@/lib/api';

export default function WorkerRegisterPage() {
  const router = useRouter();
  const { address, isConnected, connect } = useWalletContext();
  const [personaName, setPersonaName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  if (!isConnected) return (
    <div className="max-w-sm mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🔧</div>
      <p className="text-slate-400 mb-6">Connect your wallet to register as a worker and start earning cUSD</p>
      <button onClick={connect} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
        Connect Wallet
      </button>
    </div>
  );

  if (registered) return (
    <div className="max-w-sm mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4">🎉</div>
      <h2 className="text-xl font-bold text-white mb-2">Welcome, {personaName || 'Worker'}!</h2>
      <p className="text-slate-500 text-sm mb-6">
        Your profile is set up. Go to your dashboard to see tasks assigned to you and start earning cUSD.
      </p>
      <button
        onClick={() => router.push('/worker')}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors text-sm"
      >
        Go to My Dashboard →
      </button>
    </div>
  );

  const handleRegister = async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      await api.workers.register({
        walletAddress: address,
        workerType: 'HUMAN',
        personaName: personaName.trim() || undefined,
      });
      setRegistered(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      <SectionHeader title="Register as Worker" subtitle="Set up your profile to receive tasks and earn cUSD" />
      <div className="space-y-4">
        <div>
          <label className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
            Display Name <span className="normal-case text-slate-600">(optional)</span>
          </label>
          <input
            value={personaName}
            onChange={e => setPersonaName(e.target.value)}
            placeholder="e.g. DataLabeler_42"
            className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1.5">Wallet Address</label>
          <div className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 break-all">
            {address}
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Registering...' : 'Register & Start Earning'}
        </button>
        <p className="text-xs text-slate-600 text-center">
          Registration is free. The AI will assign tasks to your wallet address automatically.
        </p>
      </div>
    </div>
  );
}
