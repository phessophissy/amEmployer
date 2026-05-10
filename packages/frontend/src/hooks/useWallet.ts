'use client';
import { useState, useEffect, useCallback } from 'react';
import { isMiniPay, getConnectedAddress, fetchCUSDBalance } from '@/lib/minipay';

export interface WalletState {
  address: `0x${string}` | null;
  balance: string;       // cUSD balance, e.g. "12.50"
  isConnected: boolean;
  isMiniPayEnv: boolean;
  isLoading: boolean;
  isWrongNetwork: boolean;
  currentChainId: number | null;
  connect: () => Promise<void>;
  switchToCelo: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isMiniPayEnv] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isMiniPay();
  });

  // Derive wrong-network from chain state (MiniPay is always Celo, skip check)
  const isWrongNetwork = !isMiniPayEnv && currentChainId !== null && currentChainId !== 42220;

  const ensureCeloNetwork = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      const chainIdHex: string = await (window.ethereum as any).request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      setCurrentChainId(chainId);
      if (chainId !== 42220) {
        await (window.ethereum as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xA4EC' }], // 42220 = 0xA4EC
        });
        setCurrentChainId(42220);
      }
    } catch (switchError: any) {
      // Chain not added yet — add Celo Mainnet
      if (switchError.code === 4902) {
        await (window.ethereum as any).request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xA4EC',
            chainName: 'Celo Mainnet',
            nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
            rpcUrls: ['https://forno.celo.org'],
            blockExplorerUrls: ['https://celoscan.io'],
          }],
        });
        setCurrentChainId(42220);
      }
    }
  }, []);

  // Public alias so components can trigger a switch without calling connect()
  const switchToCelo = ensureCeloNetwork;

  const connect = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return;
      // Request accounts (triggers MetaMask/MiniPay popup if not already connected)
      await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
      // MiniPay is always on Celo; only switch for external wallets
      if (!isMiniPay()) await ensureCeloNetwork();
      const addr = await getConnectedAddress();
      setAddress(addr);
      if (addr) {
        const bal = await fetchCUSDBalance(addr);
        setBalance(bal);
      }
    } catch {
      // User rejected — that's fine
    }
  }, [ensureCeloNetwork]);

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

        // Detect current chain
        try {
          const chainIdHex: string = await (window.ethereum as any).request({ method: 'eth_chainId' });
          if (!cancelled) setCurrentChainId(parseInt(chainIdHex, 16));
        } catch { /* no wallet injected */ }

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

  // Listen for chain/network changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const handleChainChanged = (chainIdHex: string) => {
      setCurrentChainId(parseInt(chainIdHex, 16));
    };
    (window.ethereum as any).on('chainChanged', handleChainChanged);
    return () => (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
  }, []);

  return {
    address,
    balance,
    isConnected: !!address,
    isMiniPayEnv,
    isLoading,
    isWrongNetwork,
    currentChainId,
    connect,
    switchToCelo,
    refresh,
  };
}
