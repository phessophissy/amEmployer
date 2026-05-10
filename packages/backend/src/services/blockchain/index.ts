import { ethers } from 'ethers';
import logger from '../../lib/logger';

// ABI fragments (only what we need)
const TASK_MANAGER_ABI = [
  'function createTask(uint256 reward, bytes32 metadataHash, uint256 deadlineDuration) returns (uint256)',
  'function batchCreateTasks(uint256[] rewards, bytes32[] metadataHashes, uint256[] deadlineDurations) returns (uint256[])',
  'function assignTask(uint256 taskId, address worker)',
  'function submitWork(uint256 taskId, string submissionData)',
  'function verifyTask(uint256 taskId, bool approved)',
  'function registerWorker()',
  'function registerWorkerFor(address worker)',
  'function getTask(uint256 taskId) view returns (tuple(uint256 id, address employer, uint256 reward, uint8 status, address assignedWorker, uint256 deadline, bytes32 metadataHash, string submissionData, uint256 createdAt, uint256 completedAt))',
  'function getWorkerStats(address worker) view returns (uint256 reputation, uint256 completedTasks, uint256 failedTasks, uint256 earnings, bool isRegistered)',
  'function getPlatformStats() view returns (uint256 totalTasks, uint256 completedTasks, uint256 paidOut)',
  'function taskCounter() view returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed employer, uint256 reward, bytes32 metadataHash, uint256 deadline)',
  'event TaskAssigned(uint256 indexed taskId, address indexed worker)',
  'event WorkSubmitted(uint256 indexed taskId, address indexed worker)',
  'event TaskVerified(uint256 indexed taskId, address indexed worker, bool approved)',
  'event PaymentReleased(uint256 indexed taskId, address indexed worker, uint256 amount)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private employerWallet: ethers.Wallet | ethers.HDNodeWallet;
  private validatorWallet: ethers.Wallet | ethers.HDNodeWallet;
  private taskManagerAddress: string;
  private cusdAddress: string;
  private taskManager: ethers.Contract;
  private cusd: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const employerKey = process.env.EMPLOYER_PRIVATE_KEY;
    const validatorKey = process.env.AI_VALIDATOR_PRIVATE_KEY || employerKey;

    if (!employerKey) {
      logger.warn('EMPLOYER_PRIVATE_KEY not set — blockchain operations will fail');
      // Create a dummy wallet for type safety
      this.employerWallet = ethers.Wallet.createRandom().connect(this.provider);
      this.validatorWallet = ethers.Wallet.createRandom().connect(this.provider);
    } else {
      this.employerWallet = new ethers.Wallet(employerKey, this.provider);
      this.validatorWallet = new ethers.Wallet(validatorKey!, this.provider);
    }

    this.taskManagerAddress = process.env.TASK_MANAGER_ADDRESS || ethers.ZeroAddress;
    this.cusdAddress = process.env.CUSD_ADDRESS || ethers.ZeroAddress;

    this.taskManager = new ethers.Contract(
      this.taskManagerAddress,
      TASK_MANAGER_ABI,
      this.validatorWallet
    );

    this.cusd = new ethers.Contract(this.cusdAddress, ERC20_ABI, this.employerWallet);
  }

  // ─── Employer operations ───────────────────────────────────────────────────

  async createTaskOnChain(
    rewardWei: bigint,
    metadataHash: string,
    deadlineSecs: number = 3600
  ): Promise<number> {
    try {
      await this._ensureAllowance(rewardWei);
      const hash = ethers.hexlify(
        ethers.zeroPadBytes(ethers.toUtf8Bytes(metadataHash.slice(0, 32)), 32)
      );
      const contract = this.taskManager.connect(this.employerWallet) as ethers.Contract;
      const tx = await contract.createTask(rewardWei, hash, deadlineSecs);
      const receipt = await tx.wait();

      const iface = new ethers.Interface(TASK_MANAGER_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'TaskCreated') {
            return Number(parsed.args.taskId);
          }
        } catch {}
      }
      throw new Error('TaskCreated event not found in receipt');
    } catch (err) {
      logger.error('createTaskOnChain failed', { err });
      throw err;
    }
  }

  async batchCreateTasksOnChain(
    tasks: Array<{ rewardWei: bigint; metadataHash: string; deadlineSecs: number }>
  ): Promise<number[]> {
    const totalReward = tasks.reduce((sum, t) => sum + t.rewardWei, 0n);
    await this._ensureAllowance(totalReward);

    const rewards = tasks.map((t) => t.rewardWei);
    const hashes = tasks.map((t) =>
      ethers.hexlify(ethers.zeroPadBytes(ethers.toUtf8Bytes(t.metadataHash.slice(0, 32)), 32))
    );
    const deadlines = tasks.map((t) => BigInt(t.deadlineSecs));

    const contract = this.taskManager.connect(this.employerWallet) as ethers.Contract;
    const tx = await contract.batchCreateTasks(rewards, hashes, deadlines);
    const receipt = await tx.wait();

    const iface = new ethers.Interface(TASK_MANAGER_ABI);
    const taskIds: number[] = [];
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'TaskCreated') {
          taskIds.push(Number(parsed.args.taskId));
        }
      } catch {}
    }
    return taskIds;
  }

  // ─── Validator operations ──────────────────────────────────────────────────

  async registerWorkerOnChain(workerAddress: string): Promise<void> {
    try {
      const tx = await this.taskManager.registerWorkerFor(workerAddress);
      await tx.wait();
      logger.info(`Registered worker ${workerAddress} on-chain`);
    } catch (err) {
      logger.error('registerWorkerFor failed', { workerAddress, err });
      throw err;
    }
  }

  async assignTaskOnChain(taskId: number, workerAddress: string): Promise<void> {
    try {
      const tx = await this.taskManager.assignTask(taskId, workerAddress);
      await tx.wait();
    } catch (err) {
      logger.error('assignTask failed', { taskId, workerAddress, err });
      throw err;
    }
  }

  async verifyTaskOnChain(taskId: number, approved: boolean): Promise<void> {
    try {
      const tx = await this.taskManager.verifyTask(taskId, approved);
      await tx.wait();
    } catch (err) {
      logger.error('verifyTask failed', { taskId, approved, err });
      throw err;
    }
  }

  // ─── Views ─────────────────────────────────────────────────────────────────

  async getPlatformStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    paidOut: string;
  }> {
    try {
      const [totalTasks, completedTasks, paidOut] = await this.taskManager.getPlatformStats();
      return {
        totalTasks: Number(totalTasks),
        completedTasks: Number(completedTasks),
        paidOut: ethers.formatEther(paidOut),
      };
    } catch {
      return { totalTasks: 0, completedTasks: 0, paidOut: '0' };
    }
  }

  async getWorkerStatsOnChain(
    workerAddress: string
  ): Promise<{ reputation: number; completedTasks: number; earnings: string }> {
    try {
      const [reputation, completedTasks, , earnings] = await this.taskManager.getWorkerStats(
        workerAddress
      );
      return {
        reputation: Number(reputation),
        completedTasks: Number(completedTasks),
        earnings: ethers.formatEther(earnings),
      };
    } catch {
      return { reputation: 50, completedTasks: 0, earnings: '0' };
    }
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.cusd.balanceOf(address);
    return ethers.formatEther(balance);
  }

  // ─── Token helper ─────────────────────────────────────────────────────────

  private async _ensureAllowance(amount: bigint): Promise<void> {
    const allowance = await this.cusd.allowance(
      this.employerWallet.address,
      this.taskManagerAddress
    );
    if (allowance < amount) {
      const tx = await this.cusd.approve(this.taskManagerAddress, ethers.MaxUint256);
      await tx.wait();
      logger.info('Approved TaskManager to spend cUSD');
    }
  }

  // ─── Fund a wallet with cUSD (for simulation faucet) ─────────────────────

  async fundWalletWithCUSD(toAddress: string, amountEther: string): Promise<string> {
    try {
      const amount = ethers.parseEther(amountEther);
      const tx = await this.cusd.transfer(toAddress, amount);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      logger.error('fundWallet failed', { toAddress, err });
      throw err;
    }
  }

  getEmployerAddress(): string {
    return this.employerWallet.address;
  }
  getValidatorAddress(): string {
    return this.validatorWallet.address;
  }
}

export const blockchain = new BlockchainService();
