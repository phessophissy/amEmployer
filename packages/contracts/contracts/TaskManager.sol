// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TaskManager
 * @notice Core contract for the amEmployer autonomous labor platform.
 *         Handles task lifecycle: creation → assignment → submission → validation → payment.
 * @dev Funds are held in escrow per task. Payments released by AI validator on-chain.
 */
contract TaskManager is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────────────────

    IERC20 public paymentToken;
    address public aiValidatorAddress;
    uint256 public platformFeePercent = 5; // 5% platform fee
    uint256 public taskCounter;
    uint256 public totalTasksCompleted;
    uint256 public totalPaidOut;

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum TaskStatus {
        OPEN,       // Available for assignment
        ASSIGNED,   // Assigned to a worker
        SUBMITTED,  // Worker submitted result
        VERIFIED,   // AI confirmed valid
        REJECTED,   // AI rejected submission
        PAID        // Payment released to worker
    }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Task {
        uint256 id;
        address employer;
        uint256 reward;
        TaskStatus status;
        address assignedWorker;
        uint256 deadline;
        bytes32 metadataHash;   // Hash of off-chain task metadata (IPFS/JSON)
        string submissionData;   // Worker's submission
        uint256 createdAt;
        uint256 completedAt;
    }

    struct WorkerProfile {
        address wallet;
        uint256 reputation;      // 0–100
        uint256 completedTasks;
        uint256 failedTasks;
        uint256 earnings;        // Cumulative earnings in token base units
        bool isRegistered;
        uint256 registeredAt;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(uint256 => Task) public tasks;
    mapping(address => WorkerProfile) public workers;
    mapping(address => uint256[]) private _workerTaskIds;
    mapping(address => uint256[]) private _employerTaskIds;

    // ─── Events ───────────────────────────────────────────────────────────────

    event TaskCreated(
        uint256 indexed taskId,
        address indexed employer,
        uint256 reward,
        bytes32 metadataHash,
        uint256 deadline
    );
    event TaskAssigned(uint256 indexed taskId, address indexed worker);
    event WorkSubmitted(uint256 indexed taskId, address indexed worker);
    event TaskVerified(uint256 indexed taskId, address indexed worker, bool approved);
    event PaymentReleased(uint256 indexed taskId, address indexed worker, uint256 amount);
    event WorkerSlashed(address indexed worker, uint256 indexed taskId);
    event WorkerRegistered(address indexed worker);
    event ValidatorUpdated(address indexed newValidator);
    event TaskExpiredReclaimed(uint256 indexed taskId, address indexed employer, uint256 amount);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAIValidator() {
        require(
            msg.sender == aiValidatorAddress || msg.sender == owner(),
            "TaskManager: caller is not AI validator"
        );
        _;
    }

    modifier taskExists(uint256 taskId) {
        require(taskId > 0 && taskId <= taskCounter, "TaskManager: task does not exist");
        _;
    }

    modifier onlyRegisteredWorker() {
        require(workers[msg.sender].isRegistered, "TaskManager: worker not registered");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _paymentToken,
        address _aiValidator
    ) Ownable(msg.sender) {
        require(_paymentToken != address(0), "TaskManager: invalid token");
        require(_aiValidator != address(0), "TaskManager: invalid validator");
        paymentToken = IERC20(_paymentToken);
        aiValidatorAddress = _aiValidator;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setAIValidator(address _validator) external onlyOwner {
        require(_validator != address(0), "TaskManager: invalid address");
        aiValidatorAddress = _validator;
        emit ValidatorUpdated(_validator);
    }

    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 20, "TaskManager: fee too high");
        platformFeePercent = _feePercent;
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        // Only withdraw unclaimed platform fees (not escrowed task funds)
        // This is simplified; in production track separately
        paymentToken.safeTransfer(owner(), balance);
    }

    // ─── Worker Registration ──────────────────────────────────────────────────

    function registerWorker() external {
        require(!workers[msg.sender].isRegistered, "TaskManager: already registered");
        workers[msg.sender] = WorkerProfile({
            wallet: msg.sender,
            reputation: 50, // Start at midpoint
            completedTasks: 0,
            failedTasks: 0,
            earnings: 0,
            isRegistered: true,
            registeredAt: block.timestamp
        });
        emit WorkerRegistered(msg.sender);
    }

    // Allow validator to register workers on their behalf (for scripted/AI workers)
    function registerWorkerFor(address worker) external onlyAIValidator {
        require(!workers[worker].isRegistered, "TaskManager: already registered");
        workers[worker] = WorkerProfile({
            wallet: worker,
            reputation: 50,
            completedTasks: 0,
            failedTasks: 0,
            earnings: 0,
            isRegistered: true,
            registeredAt: block.timestamp
        });
        emit WorkerRegistered(worker);
    }

    // ─── Task Lifecycle ───────────────────────────────────────────────────────

    /**
     * @notice Create a single task with escrowed reward.
     * @param reward Amount of payment token to escrow.
     * @param metadataHash keccak256 hash of the off-chain task metadata.
     * @param deadlineDuration Seconds until task expires.
     */
    function createTask(
        uint256 reward,
        bytes32 metadataHash,
        uint256 deadlineDuration
    ) external nonReentrant returns (uint256 taskId) {
        require(reward > 0, "TaskManager: reward must be > 0");
        require(deadlineDuration >= 60, "TaskManager: deadline too short");
        require(metadataHash != bytes32(0), "TaskManager: empty metadata hash");

        paymentToken.safeTransferFrom(msg.sender, address(this), reward);

        unchecked { taskCounter++; }
        taskId = taskCounter;

        tasks[taskId] = Task({
            id: taskId,
            employer: msg.sender,
            reward: reward,
            status: TaskStatus.OPEN,
            assignedWorker: address(0),
            deadline: block.timestamp + deadlineDuration,
            metadataHash: metadataHash,
            submissionData: "",
            createdAt: block.timestamp,
            completedAt: 0
        });

        _employerTaskIds[msg.sender].push(taskId);
        emit TaskCreated(taskId, msg.sender, reward, metadataHash, block.timestamp + deadlineDuration);
    }

    /**
     * @notice Batch create tasks (gas optimised for AI employer agent).
     * @dev Maximum 50 tasks per batch to prevent unbounded loops.
     */
    function batchCreateTasks(
        uint256[] calldata rewards,
        bytes32[] calldata metadataHashes,
        uint256[] calldata deadlineDurations
    ) external nonReentrant returns (uint256[] memory taskIds) {
        uint256 len = rewards.length;
        require(len > 0 && len <= 50, "TaskManager: invalid batch size");
        require(len == metadataHashes.length && len == deadlineDurations.length, "TaskManager: length mismatch");

        uint256 totalReward;
        for (uint256 i; i < len; ) {
            require(rewards[i] > 0, "TaskManager: reward must be > 0");
            require(deadlineDurations[i] >= 60, "TaskManager: deadline too short");
            unchecked { totalReward += rewards[i]; i++; }
        }

        paymentToken.safeTransferFrom(msg.sender, address(this), totalReward);

        taskIds = new uint256[](len);
        for (uint256 i; i < len; ) {
            unchecked { taskCounter++; }
            uint256 taskId = taskCounter;

            tasks[taskId] = Task({
                id: taskId,
                employer: msg.sender,
                reward: rewards[i],
                status: TaskStatus.OPEN,
                assignedWorker: address(0),
                deadline: block.timestamp + deadlineDurations[i],
                metadataHash: metadataHashes[i],
                submissionData: "",
                createdAt: block.timestamp,
                completedAt: 0
            });

            _employerTaskIds[msg.sender].push(taskId);
            taskIds[i] = taskId;
            emit TaskCreated(taskId, msg.sender, rewards[i], metadataHashes[i], block.timestamp + deadlineDurations[i]);
            unchecked { i++; }
        }
    }

    /**
     * @notice Assign an open task to a worker. Called by AI validator.
     */
    function assignTask(uint256 taskId, address worker) external taskExists(taskId) onlyAIValidator {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.OPEN, "TaskManager: task not open");
        require(workers[worker].isRegistered, "TaskManager: worker not registered");
        require(block.timestamp < task.deadline, "TaskManager: task expired");

        task.status = TaskStatus.ASSIGNED;
        task.assignedWorker = worker;
        _workerTaskIds[worker].push(taskId);

        emit TaskAssigned(taskId, worker);
    }

    /**
     * @notice Worker submits their completed work.
     * @param submissionData Off-chain reference or inline result data.
     */
    function submitWork(
        uint256 taskId,
        string calldata submissionData
    ) external taskExists(taskId) onlyRegisteredWorker nonReentrant {
        Task storage task = tasks[taskId];
        require(task.assignedWorker == msg.sender, "TaskManager: not assigned worker");
        require(task.status == TaskStatus.ASSIGNED, "TaskManager: task not assigned");
        require(block.timestamp < task.deadline, "TaskManager: deadline passed");
        require(bytes(submissionData).length > 0, "TaskManager: empty submission");

        task.submissionData = submissionData;
        task.status = TaskStatus.SUBMITTED;

        emit WorkSubmitted(taskId, msg.sender);
    }

    /**
     * @notice AI validator verifies a submitted task. Triggers payout or slash.
     */
    function verifyTask(uint256 taskId, bool approved) external taskExists(taskId) onlyAIValidator nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.SUBMITTED, "TaskManager: task not submitted");

        if (approved) {
            task.status = TaskStatus.VERIFIED;
            _releasePayment(taskId);
        } else {
            task.status = TaskStatus.REJECTED;
            _slashWorkerReputation(task.assignedWorker, taskId);
            // Re-open for reassignment
            task.status = TaskStatus.OPEN;
            task.assignedWorker = address(0);
            task.submissionData = "";
        }

        emit TaskVerified(taskId, task.assignedWorker, approved);
    }

    // ─── Payment ──────────────────────────────────────────────────────────────

    function _releasePayment(uint256 taskId) internal {
        Task storage task = tasks[taskId];
        address worker = task.assignedWorker;
        uint256 reward = task.reward;

        uint256 platformFee = (reward * platformFeePercent) / 100;
        uint256 workerPayment = reward - platformFee;

        task.status = TaskStatus.PAID;
        task.completedAt = block.timestamp;
        task.reward = 0; // Prevent re-entrancy double spend

        WorkerProfile storage profile = workers[worker];
        profile.completedTasks++;
        profile.earnings += workerPayment;
        // Reputation gain: +5 per task, max 100
        profile.reputation = profile.reputation >= 95 ? 100 : profile.reputation + 5;

        unchecked {
            totalTasksCompleted++;
            totalPaidOut += workerPayment;
        }

        paymentToken.safeTransfer(worker, workerPayment);
        if (platformFee > 0) {
            paymentToken.safeTransfer(owner(), platformFee);
        }

        emit PaymentReleased(taskId, worker, workerPayment);
    }

    function _slashWorkerReputation(address worker, uint256 taskId) internal {
        WorkerProfile storage profile = workers[worker];
        profile.failedTasks++;
        // Reputation slash: -10 per failure, floor 0
        profile.reputation = profile.reputation >= 10 ? profile.reputation - 10 : 0;
        emit WorkerSlashed(worker, taskId);
    }

    /**
     * @notice Explicit slash called by AI validator (for fraud/timeout).
     */
    function slashWorker(address worker, uint256 taskId) external onlyAIValidator taskExists(taskId) {
        _slashWorkerReputation(worker, taskId);
    }

    /**
     * @notice Employer can reclaim escrow from expired tasks.
     */
    function reclaimExpiredTask(uint256 taskId) external taskExists(taskId) nonReentrant {
        Task storage task = tasks[taskId];
        require(task.employer == msg.sender, "TaskManager: not employer");
        require(block.timestamp > task.deadline, "TaskManager: not expired");
        require(
            task.status == TaskStatus.OPEN || task.status == TaskStatus.ASSIGNED,
            "TaskManager: cannot reclaim"
        );

        uint256 reward = task.reward;
        task.reward = 0;
        task.status = TaskStatus.REJECTED;

        paymentToken.safeTransfer(msg.sender, reward);
        emit TaskExpiredReclaimed(taskId, msg.sender, reward);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getTask(uint256 taskId) external view taskExists(taskId) returns (Task memory) {
        return tasks[taskId];
    }

    function getWorkerStats(address worker) external view returns (
        uint256 reputation,
        uint256 completedTasks,
        uint256 failedTasks,
        uint256 earnings,
        bool isRegistered
    ) {
        WorkerProfile storage p = workers[worker];
        return (p.reputation, p.completedTasks, p.failedTasks, p.earnings, p.isRegistered);
    }

    function getWorkerTaskIds(address worker) external view returns (uint256[] memory) {
        return _workerTaskIds[worker];
    }

    function getEmployerTaskIds(address employer) external view returns (uint256[] memory) {
        return _employerTaskIds[employer];
    }

    function getOpenTaskCount() external view returns (uint256 count) {
        // NOTE: iterate only the last 500 tasks to avoid gas limits
        uint256 start = taskCounter > 500 ? taskCounter - 500 : 1;
        for (uint256 i = start; i <= taskCounter; ) {
            if (tasks[i].status == TaskStatus.OPEN) {
                count++;
            }
            unchecked { i++; }
        }
    }

    function getPlatformStats() external view returns (
        uint256 totalTasks,
        uint256 completedTasks,
        uint256 paidOut
    ) {
        return (taskCounter, totalTasksCompleted, totalPaidOut);
    }
}
