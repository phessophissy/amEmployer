import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  mnemonic?: string;
  index: number;
}

/**
 * Generate N wallets deterministically from a mnemonic or randomly.
 */
export function generateWallets(count: number, mnemonic?: string): GeneratedWallet[] {
  const wallets: GeneratedWallet[] = [];

  if (mnemonic) {
    // Deterministic HD wallet generation
    for (let i = 0; i < count; i++) {
      const wallet = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        `m/44'/60'/0'/0/${i}`
      );
      wallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic,
        index: i,
      });
    }
  } else {
    // Random wallet generation
    for (let i = 0; i < count; i++) {
      const wallet = ethers.Wallet.createRandom();
      wallets.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        index: i,
      });
    }
  }

  return wallets;
}

/**
 * Save wallets to a JSON file (for local dev/testing).
 * WARNING: Never commit this file. For production use encrypted storage.
 */
export function saveWallets(wallets: GeneratedWallet[], outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(wallets, null, 2));
  console.log(`Saved ${wallets.length} wallets to ${outputPath}`);
}

export function loadWallets(filePath: string): GeneratedWallet[] {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// CLI entry point
if (require.main === module) {
  const count = parseInt(process.argv[2] || '100');
  console.log(`Generating ${count} wallets...`);
  const wallets = generateWallets(count);
  const outputPath = path.join(__dirname, '..', 'data', 'wallets.json');
  saveWallets(wallets, outputPath);
  console.log(`\nFirst wallet: ${wallets[0].address}`);
  console.log(`Last wallet:  ${wallets[count - 1].address}`);
}
