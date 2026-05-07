import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

// Use a dedicated mainnet deployer key if set; fall back to employer key.
// Never fall back to a zero key on mainnet — deployment will fail with a clear error.
const DEPLOY_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.EMPLOYER_PRIVATE_KEY || '';
if (!DEPLOY_KEY || DEPLOY_KEY === '0xYOUR_EMPLOYER_PRIVATE_KEY') {
  // Only warn — don't throw so `hardhat compile` still works without a key.
  if (process.env.HARDHAT_NETWORK === 'celo') {
    throw new Error('Set DEPLOYER_PRIVATE_KEY (or EMPLOYER_PRIVATE_KEY) in .env before deploying to mainnet.');
  }
}
const accounts = DEPLOY_KEY ? [DEPLOY_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'paris',
      // Enable the metadata hash so CeloScan can verify sources
      metadata: { bytecodeHash: 'ipfs' },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    alfajores: {
      url: process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
      chainId: 44787,
      accounts,
      // EIP-1559 — base fee on Alfajores is negligible; 5 gwei covers any spike
      maxFeePerGas: 5_000_000_000,        // 5 gwei
      maxPriorityFeePerGas: 1_000_000_000, // 1 gwei
    },
    celo: {
      url: process.env.CELO_MAINNET_RPC_URL || 'https://forno.celo.org',
      chainId: 42220,
      accounts,
      // Celo mainnet EIP-1559 — 10 gwei max fee is conservative and safe
      maxFeePerGas: 10_000_000_000,        // 10 gwei
      maxPriorityFeePerGas: 2_000_000_000, // 2 gwei
      // Require more confirmations before Hardhat considers a tx mined
      timeout: 120_000, // 2 min — mainnet blocks are ~5s
    },
  },
  etherscan: {
    apiKey: {
      alfajores: process.env.CELOSCAN_API_KEY || '',
      celo: process.env.CELOSCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'alfajores',
        chainId: 44787,
        urls: {
          apiURL: 'https://api-alfajores.celoscan.io/api',
          browserURL: 'https://alfajores.celoscan.io',
        },
      },
      {
        network: 'celo',
        chainId: 42220,
        urls: {
          apiURL: 'https://api.celoscan.io/api',
          browserURL: 'https://celoscan.io',
        },
      },
    ],
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;
