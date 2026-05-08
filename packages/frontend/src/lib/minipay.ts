/**
 * MiniPay detection and viem wallet utilities.
 * Keeps all MiniPay-specific logic in one place.
 */
import { createWalletClient, createPublicClient, custom, http, formatUnits } from 'viem';
import { celo } from 'viem/chains';

/** True when the app is running inside the MiniPay wallet. */
export function isMiniPay(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.ethereum !== 'undefined' &&
    (window.ethereum as any).isMiniPay === true
  );
}

/** cUSD (USDm) contract address on Celo Mainnet. */
export const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as const;

/** MiniPay deposit deeplink — redirect here on insufficient balance. */
export const MINIPAY_DEPOSIT_LINK = 'https://minipay.opera.com/add_cash';

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org'),
});

/** Fetch cUSD balance for an address, returns a human-readable string like "12.50". */
export async function fetchCUSDBalance(address: `0x${string}`): Promise<string> {
  try {
    const raw = await publicClient.readContract({
      address: CUSD_ADDRESS,
      abi: ERC20_BALANCE_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
    return parseFloat(formatUnits(raw, 18)).toFixed(2);
  } catch {
    return '0.00';
  }
}

/** Create a viem WalletClient using window.ethereum (injected by MiniPay/MetaMask). */
export function createInjectedWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  return createWalletClient({
    chain: celo,
    transport: custom(window.ethereum as any),
  });
}

/** Get the first connected address from window.ethereum. */
export async function getConnectedAddress(): Promise<`0x${string}` | null> {
  const client = createInjectedWalletClient();
  if (!client) return null;
  try {
    const [address] = await client.getAddresses();
    return address ?? null;
  } catch {
    return null;
  }
}

/** Open MiniPay deposit page if balance is insufficient. */
export function promptDeposit() {
  if (typeof window !== 'undefined') {
    window.open(MINIPAY_DEPOSIT_LINK, '_blank');
  }
}
