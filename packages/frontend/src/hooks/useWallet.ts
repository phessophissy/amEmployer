'use client';
import { useState, useEffect, useCallback } from 'react';
import { isMiniPay, getConnectedAddress, fetchCUSDBalance } from '@/lib/minipay';

export interface WalletState {
  address: `0x${string}` | null;
  balance: string;       // cUSD balance, e.g. "12.50"
  isConnected: boolean;
  isMiniPayEnv: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [isMiniPayEnv] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isMiniPay();
  });

  const connect = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return;
      // Request accounts (triggers MetaMask/MiniPay popup if not already connected)
      await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
      const addr = await getConnectedAddress();
      setAddress(addr);
      if (addr) {
        const bal = await fetchCUSDBalance(addr);
        setBalance(bal);
      }
    } catch {
      // User rejected — that's fine
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!address) return;
    const bal = await fetchCUSDBalance(address);
    setBalance(bal);
  }, [address]);

  // On mount: auto-connect in MiniPay; check if already connected elsewhere
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setIsLoading(true);
      try {
        if (typeof window === 'undefined' || !window.ethereum) return;

        if (isMiniPay()) {
          // MiniPay: silently get address without a popup
          const addr = await getConnectedAddress();
          if (!cancelled && addr) {
            setAddress(addr);
            const bal = await fetchCUSDBalance(addr);
            if (!cancelled) setBalance(bal);
          }
        } else {
          // Outside MiniPay: check if already connected (no popup)
          try {
            const accounts: string[] = await (window.ethereum as any).request({
              method: 'eth_accounts',
            });
            if (!cancelled && accounts[0]) {
              const addr = accounts[0] as `0x${string}`;
              setAddress(addr);
              const bal = await fetchCUSDBalance(addr);
              if (!cancelled) setBalance(bal);
            }
          } catch {
            // not connected
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const handleChange = (accounts: string[]) => {
      const addr = accounts[0] as `0x${string}` | undefined;
      setAddress(addr ?? null);
      if (addr) fetchCUSDBalance(addr).then(setBalance);
      else setBalance('0.00');
    };
    (window.ethereum as any).on('accountsChanged', handleChange);
    return () => (window.ethereum as any).removeListener('accountsChanged', handleChange);
  }, []);

  return {
    address,
    balance,
    isConnected: !!address,
    isMiniPayEnv,
    isLoading,
    connect,
    refresh,
  };
}
