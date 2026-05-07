import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`\n🚀 Deploying amEmployer contracts`);
  console.log(`   Network:  ${network.name} (chainId: ${network.chainId})`);
  console.log(`   Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`   Balance:  ${ethers.formatEther(balance)} CELO\n`);

  // cUSD address per network
  const CUSD_ADDRESSES: Record<string, string> = {
    '44787': '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Alfajores
    '42220': '0x765DE816845861e75A25fCA122bb6898B8B1282a', // Mainnet
    '31337': '',  // Local — will deploy a mock ERC20
  };

  const chainId = network.chainId.toString();
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
  console.log('\n⚙️  Deploying WorkerRegistry...');
  const WorkerRegistry = await ethers.getContractFactory('WorkerRegistry');
  const workerRegistry = await WorkerRegistry.deploy();
  await workerRegistry.waitForDeployment();
  const workerRegistryAddress = await workerRegistry.getAddress();
  console.log(`   WorkerRegistry: ${workerRegistryAddress}`);

  // Deploy TaskManager
  console.log('\n⚙️  Deploying TaskManager...');
  const TaskManager = await ethers.getContractFactory('TaskManager');
  const taskManager = await TaskManager.deploy(cusdAddress, deployer.address);
  await taskManager.waitForDeployment();
  const taskManagerAddress = await taskManager.getAddress();
  console.log(`   TaskManager:    ${taskManagerAddress}`);

  // Authorize TaskManager to call WorkerRegistry
  console.log('\n⚙️  Authorizing TaskManager in WorkerRegistry...');
  const authTx = await workerRegistry.setTaskManagerAuthorization(taskManagerAddress, true);
  await authTx.wait();
  console.log('   ✅ Authorized');

  // Save deployment addresses
  const deployment = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      TaskManager: taskManagerAddress,
      WorkerRegistry: workerRegistryAddress,
      cUSD: cusdAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const filename = `${network.name}_${chainId}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deployment, null, 2)
  );

  // Also write to a shared location for the backend
  const sharedDir = path.join(__dirname, '..', '..', '..', 'deployments');
  if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, `${chainId}.json`), JSON.stringify(deployment, null, 2));

  console.log(`\n✅ Deployment complete!`);
  console.log(`   TaskManager:    ${taskManagerAddress}`);
  console.log(`   WorkerRegistry: ${workerRegistryAddress}`);
  console.log(`   cUSD:           ${cusdAddress}`);
  console.log(`\n📄 Saved to deployments/${filename}`);
  console.log('\n🔧 Add to .env:');
  console.log(`TASK_MANAGER_ADDRESS="${taskManagerAddress}"`);
  console.log(`WORKER_REGISTRY_ADDRESS="${workerRegistryAddress}"`);
  console.log(`CUSD_ADDRESS="${cusdAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Deployment failed:', err);
    process.exit(1);
  });
