import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const CONFIRMATIONS: Record<string, number> = {
  '31337': 1,  // local
  '44787': 2,  // Alfajores
  '42220': 5,  // Celo mainnet — wait for 5 confirmations
};

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const isMainnet = chainId === '42220';
  const confirmations = CONFIRMATIONS[chainId] ?? 2;

  console.log(`\n${'═'.repeat(58)}`);
  console.log(`  amEmployer — Contract Deployment`);
  console.log(`${'═'.repeat(58)}`);
  console.log(`  Network:       ${network.name} (chainId: ${chainId})`);
  console.log(`  Deployer:      ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceEth = parseFloat(ethers.formatEther(balance));
  console.log(`  Balance:       ${balanceEth.toFixed(6)} CELO`);
  console.log(`  Confirmations: ${confirmations} per transaction`);

  if (isMainnet) {
    console.log(`\n  ⚠️  MAINNET DEPLOYMENT — this will spend real CELO`);
    if (balanceEth < 0.01) {
      throw new Error(`Insufficient balance (${balanceEth} CELO). Need at least 0.01 CELO for gas.`);
    }
    const answer = await prompt('\n  Type "deploy mainnet" to confirm: ');
    if (answer.trim() !== 'deploy mainnet') {
      console.log('  Aborted.');
      process.exit(0);
    }
  }

  console.log('');

  // cUSD address per network
  const CUSD_ADDRESSES: Record<string, string> = {
    '44787': '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Alfajores
    '42220': '0x765DE816845861e75A25fCA122bb6898B8B1282a', // Mainnet
    '31337': '',  // Local — deploy a mock ERC20
  };

  let cusdAddress = CUSD_ADDRESSES[chainId];

  // Deploy mock ERC20 for local testing
  if (!cusdAddress) {
    console.log('⚙️  Deploying MockERC20 (local dev)...');
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const mock = await MockERC20.deploy('Mock cUSD', 'cUSD', ethers.parseEther('10000000'));
    await mock.waitForDeployment();
    cusdAddress = await mock.getAddress();
    console.log(`   MockERC20: ${cusdAddress}`);
  }

  // Deploy WorkerRegistry
  console.log('⚙️  Deploying WorkerRegistry...');
  const WorkerRegistry = await ethers.getContractFactory('WorkerRegistry');
  const workerRegistry = await WorkerRegistry.deploy();
  const wrDeployTx = workerRegistry.deploymentTransaction();
  await workerRegistry.waitForDeployment();
  if (wrDeployTx) await wrDeployTx.wait(confirmations);
  const workerRegistryAddress = await workerRegistry.getAddress();
  console.log(`   WorkerRegistry: ${workerRegistryAddress}`);
  if (wrDeployTx) console.log(`   Tx: ${wrDeployTx.hash}`);

  // Deploy TaskManager
  console.log('\n⚙️  Deploying TaskManager...');
  const TaskManager = await ethers.getContractFactory('TaskManager');
  const taskManager = await TaskManager.deploy(cusdAddress, deployer.address);
  const tmDeployTx = taskManager.deploymentTransaction();
  await taskManager.waitForDeployment();
  if (tmDeployTx) await tmDeployTx.wait(confirmations);
  const taskManagerAddress = await taskManager.getAddress();
  console.log(`   TaskManager:    ${taskManagerAddress}`);
  if (tmDeployTx) console.log(`   Tx: ${tmDeployTx.hash}`);

  // Authorize TaskManager in WorkerRegistry
  console.log('\n⚙️  Authorizing TaskManager in WorkerRegistry...');
  const authTx = await workerRegistry.setTaskManagerAuthorization(taskManagerAddress, true);
  await authTx.wait(confirmations);
  console.log(`   ✅ Authorized (Tx: ${authTx.hash})`);

  // Save deployment record
  const deployment = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      TaskManager: taskManagerAddress,
      WorkerRegistry: workerRegistryAddress,
      cUSD: cusdAddress,
    },
    txHashes: {
      WorkerRegistry: wrDeployTx?.hash ?? '',
      TaskManager: tmDeployTx?.hash ?? '',
    },
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const filename = `${network.name}_${chainId}.json`;
  fs.writeFileSync(path.join(deploymentsDir, filename), JSON.stringify(deployment, null, 2));

  // Shared location read by the backend
  const sharedDir = path.join(__dirname, '..', '..', '..', 'deployments');
  if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, `${chainId}.json`), JSON.stringify(deployment, null, 2));

  const explorerBase = isMainnet ? 'https://celoscan.io' : 'https://alfajores.celoscan.io';

  console.log(`\n${'═'.repeat(58)}`);
  console.log(`  ✅ Deployment complete`);
  console.log(`${'═'.repeat(58)}`);
  console.log(`  TaskManager:    ${taskManagerAddress}`);
  console.log(`  WorkerRegistry: ${workerRegistryAddress}`);
  console.log(`  cUSD:           ${cusdAddress}`);
  console.log(`  Explorer:       ${explorerBase}/address/${taskManagerAddress}`);
  console.log(`\n  📄 Saved to deployments/${filename}`);

  console.log(`\n  ── Add to .env ──────────────────────────────────────`);
  console.log(`  CELO_RPC_URL="${isMainnet ? 'https://forno.celo.org' : 'https://alfajores-forno.celo-testnet.org'}"`);
  console.log(`  CELO_CHAIN_ID=${chainId}`);
  console.log(`  TASK_MANAGER_ADDRESS="${taskManagerAddress}"`);
  console.log(`  WORKER_REGISTRY_ADDRESS="${workerRegistryAddress}"`);
  console.log(`  CUSD_ADDRESS="${cusdAddress}"`);

  if (process.env.CELOSCAN_API_KEY) {
    const network_flag = isMainnet ? 'celo' : 'alfajores';
    console.log(`\n  ── Verify contracts on CeloScan ─────────────────────`);
    console.log(`  npx hardhat verify --network ${network_flag} ${workerRegistryAddress}`);
    console.log(`  npx hardhat verify --network ${network_flag} ${taskManagerAddress} "${cusdAddress}" "${deployer.address}"`);
  } else {
    console.log(`\n  ── To verify on CeloScan, set CELOSCAN_API_KEY then run ──`);
    console.log(`  npm run contracts:verify:mainnet`);
  }
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Deployment failed:', err.message || err);
    process.exit(1);
  });

