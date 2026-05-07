import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const EMPLOYER_PRIVATE_KEY = process.env.EMPLOYER_PRIVATE_KEY || '0x' + '0'.repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: 'paris',
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
      accounts: [EMPLOYER_PRIVATE_KEY],
      gasPrice: 5000000000, // 5 gwei
    },
    celo: {
      url: 'https://forno.celo.org',
      chainId: 42220,
      accounts: [EMPLOYER_PRIVATE_KEY],
      gasPrice: 5000000000,
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
