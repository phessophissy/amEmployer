'use client';
import { useState } from 'react';
import { createInjectedWalletClient } from '@/lib/minipay';
import { CUSD_ADDRESS } from '@/lib/minipay';
import { parseUnits } from 'viem';

const ERC20_TRANSFER_ABI = [{
  name: 'transfer',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

interface SendCUSDProps {
  onSuccess?: (txHash: string) => void;
}

export function SendCUSD({ onSuccess }: SendCUSDProps) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!to || !amount) return;
    setError('');
    setLoading(true);
    try {
      const client = createInjectedWalletClient();
      if (!client) throw new Error('No wallet connected');
      const [address] = await client.getAddresses();
      const hash = await client.writeContract({
        address: CUSD_ADDRESS,
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [to as `0x${string}`, parseUnits(amount, 18)],
        account: address,
      });
      onSuccess?.(hash);
      setTo('');
      setAmount('');
    } catch (e: any) {
      setError(e.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-700/40 rounded-xl space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Send cUSD</h3>
      <input
        value={to}
        onChange={e => setTo(e.target.value)}
        placeholder="Recipient address (0x...)"
        className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none"
      />
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount in cUSD"
        className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none"
      />
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
      <button
        onClick={handleSend}
        disabled={loading || !to || !amount}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all"
      >
        {loading ? 'Sending…' : 'Send cUSD'}
      </button>
    </div>
  );
}
