'use client';
import React, { createContext, useContext } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import { useWallet, WalletState } from '@/hooks/useWallet';

const queryClient = new QueryClient();

const WalletContext = createContext<WalletState | null>(null);

function WalletStateProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletStateProvider>{children}</WalletStateProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useWalletContext(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used inside WalletProvider');
  return ctx;
}
