import { http, createConfig } from 'wagmi';
import { celo } from 'viem/chains';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [
    injected({ target: 'metaMask' }), // works for both MiniPay and MetaMask
  ],
  transports: {
    [celo.id]: http('https://forno.celo.org'),
  },
  ssr: true,
});
