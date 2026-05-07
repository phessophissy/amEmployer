// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorkerRegistry
 * @notice Soulbound (non-transferable) NFT-based worker identity & reputation system.
 *         Each worker wallet gets one NFT representing their on-chain identity.
 */
contract WorkerRegistry is ERC721, Ownable {

    uint256 private _tokenIdCounter;

    struct WorkerIdentity {
        uint256 tokenId;
        address wallet;
        string personaName;       // e.g. "DataLabeler", "Translator", "Moderator"
        WorkerType workerType;
        uint256 level;            // Computed from reputation: 1-10
        uint256 mintedAt;
        bool active;
    }

    enum WorkerType { HUMAN, SCRIPTED, AI_AGENT }

    mapping(address => uint256) public walletToTokenId;   // wallet → NFT token ID
    mapping(uint256 => WorkerIdentity) public identities; // tokenId → identity
    mapping(address => bool) public authorizedTaskManagers;

    event WorkerMinted(address indexed wallet, uint256 indexed tokenId, string personaName);
    event WorkerDeactivated(address indexed wallet, uint256 indexed tokenId);
    event TaskManagerAuthorized(address indexed taskManager, bool authorized);

    modifier onlyAuthorized() {
        require(
            authorizedTaskManagers[msg.sender] || msg.sender == owner(),
            "WorkerRegistry: not authorized"
        );
        _;
    }

    constructor() ERC721("amEmployer Worker ID", "AWID") Ownable(msg.sender) {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setTaskManagerAuthorization(address taskManager, bool authorized) external onlyOwner {
        authorizedTaskManagers[taskManager] = authorized;
        emit TaskManagerAuthorized(taskManager, authorized);
    }

    // ─── Minting ──────────────────────────────────────────────────────────────

    /**
     * @notice Mint a soulbound worker identity NFT.
     * @dev Only one NFT per wallet. Non-transferable (soulbound).
     */
    function mintWorkerNFT(
        address worker,
        string calldata personaName,
        WorkerType workerType
    ) external onlyAuthorized returns (uint256 tokenId) {
        require(walletToTokenId[worker] == 0, "WorkerRegistry: already has identity");
        require(bytes(personaName).length > 0, "WorkerRegistry: empty persona name");

        unchecked { _tokenIdCounter++; }
        tokenId = _tokenIdCounter;

        _safeMint(worker, tokenId);

        identities[tokenId] = WorkerIdentity({
            tokenId: tokenId,
            wallet: worker,
            personaName: personaName,
            workerType: workerType,
            level: 1,
            mintedAt: block.timestamp,
            active: true
        });

        walletToTokenId[worker] = tokenId;
        emit WorkerMinted(worker, tokenId, personaName);
    }

    /**
     * @notice Update worker level based on reputation score (called by TaskManager).
     */
    function updateWorkerLevel(address worker, uint256 reputation) external onlyAuthorized {
        uint256 tokenId = walletToTokenId[worker];
        require(tokenId != 0, "WorkerRegistry: no identity");

        // Level 1-10 based on reputation 0-100
        uint256 newLevel = (reputation / 10) + 1;
        if (newLevel > 10) newLevel = 10;
        if (newLevel < 1) newLevel = 1;

        identities[tokenId].level = newLevel;
    }

    function deactivateWorker(address worker) external onlyAuthorized {
        uint256 tokenId = walletToTokenId[worker];
        require(tokenId != 0, "WorkerRegistry: no identity");
        identities[tokenId].active = false;
        emit WorkerDeactivated(worker, tokenId);
    }

    // ─── Soulbound: Block Transfers ───────────────────────────────────────────

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Allow minting (from == address(0)) but block transfers
        require(from == address(0), "WorkerRegistry: soulbound - non-transferable");
        return super._update(to, tokenId, auth);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getWorkerIdentity(address worker) external view returns (WorkerIdentity memory) {
        uint256 tokenId = walletToTokenId[worker];
        require(tokenId != 0, "WorkerRegistry: no identity");
        return identities[tokenId];
    }

    function hasIdentity(address worker) external view returns (bool) {
        return walletToTokenId[worker] != 0;
    }

    function totalWorkers() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
