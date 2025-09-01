// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "./AirdropRewardPool.sol";


/**
 * @title MerkleAirdrop
 * @dev 基于UUPS的可升级空投合约
 */
contract MerkleAirdrop is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // 关联的中央奖励池
    AirdropRewardPool public rewardPool;

    // 空投活动结构体
    struct Airdrop {
        uint256 id; // 活动ID
        string name; // 活动名称
        bytes32 merkleRoot; // 默克尔树根哈希
        uint256 totalReward; // 总奖励数量
        uint256 claimedReward; // 已领取奖励数量
        uint256 startTime; // 开始时间戳
        uint256 endTime; // 结束时间戳
        bool isActive; // 是否激活
    }

    // 存储结构
    mapping(uint256 => Airdrop) public airdrops; // 活动ID => 活动信息
    mapping(uint256 => mapping(address => bool)) public claimed; // 活动ID => 地址 => 是否已领取
    uint256 public airdropCount; // 活动计数器

    // 事件
    event AirdropCreated(
        uint256 indexed airdropId,
        string name,
        bytes32 merkleRoot,
        uint256 totalReward
    );
    event AirdropActivated(uint256 indexed airdropId);
    event RewardClaimed(
        uint256 indexed airdropId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event RewardPoolUpdated(address indexed oldPool, address indexed newPool);

    //  禁止直接初始化实现合约
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev 初始化函数 - 替代构造函数
     * @param _rewardPool 中央奖励池地址
     */
    function initialize(address _rewardPool) external initializer {
        require(_rewardPool != address(0), "Invalid token address");

        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        // 关联奖励池并同步奖励代币
        rewardPool = AirdropRewardPool(_rewardPool);
        // 确保奖励池已授权当前合约（避免初始化后无法发放奖励）
        // require(
        //     rewardPool.authorizedAirdrops(address(this)),
        //     "Not authorized by reward pool"
        // );
    }


    // 👇 必须添加的辅助函数：计算叶子节点哈希（与 claimReward 中逻辑一致）
    function calculateLeafHash(address user, uint256 amount) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, amount));
    }

    /**
     * @dev 创建空投活动（仅管理员）
     */
    function createAirdrop(
        string calldata name,
        bytes32 merkleRoot,
        uint256 totalReward,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(totalReward > 0, "Total reward must be > 0");
        // require(startTime >= block.timestamp, "Start time in future");  //注釋這句代碼，允许创建未来的空投
        require(endTime > startTime, "End time after start time");
        // 正确检查奖励池余额（关键修正）
        require(rewardPool.getPoolBalance() >= totalReward, "Insufficient contract balance");
        uint256 airdropId = airdropCount;
        airdrops[airdropId] = Airdrop({
            id: airdropId,
            name: name,
            merkleRoot: merkleRoot,
            totalReward: totalReward,
            claimedReward: 0,
            startTime: startTime,
            endTime: endTime,
            isActive: false
        });

        airdropCount++;
        emit AirdropCreated(airdropId, name, merkleRoot, totalReward);
    }

    /**
    @dev 激活空投活动（仅所有者）
    */
    function activateAirdrop(uint256 airdropId) external onlyOwner {
        Airdrop storage airdrop = airdrops[airdropId];
        require(airdrop.id == airdropId, "Airdrop not exists");
        require(!airdrop.isActive, "Already active");
        require(block.timestamp >= airdrop.startTime, "Not start time yet");
        // 二次确认奖励池余额（避免激活时余额不足）
        require(
            rewardPool.getPoolBalance() >=
                airdrop.totalReward - airdrop.claimedReward,
            "Insufficient pool balance"
        );
        airdrop.isActive = true;
        emit AirdropActivated(airdropId);
    }
    /**
     * @dev 用户领取奖励（需要提供默克尔证明）
     */
    function claimReward(
        uint256 airdropId,
        uint256 amount,
        bytes32[] calldata proof
    ) external nonReentrant {
        Airdrop storage airdrop = airdrops[airdropId];
        require(airdrop.id == airdropId, "Airdrop not exists");
        require(airdrop.isActive, "Airdrop not active");
        require(
            block.timestamp >= airdrop.startTime &&
                block.timestamp <= airdrop.endTime,
            "Airdrop not in period"
        );
        require(!claimed[airdropId][msg.sender], "Already claimed");
        require(amount > 0, "Amount must be positive");

        // 1. 验证默克尔证明
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        bool isValid = MerkleProofUpgradeable.verify(
            proof,
            airdrop.merkleRoot,
            leaf
        );
        require(isValid, "Invalid merkle proof"); 
        // 2. 检查活动额度和奖励池余额
        require(
            airdrop.claimedReward + amount <= airdrop.totalReward,
            "Exceed airdrop total reward"
        );
        require(
            rewardPool.getPoolBalance() >= amount,
            "Insufficient pool balance for reward"
        );

        // 3. 更新本地状态
        claimed[airdropId][msg.sender] = true;
        airdrop.claimedReward += amount;
        // 4. 调用中央奖励池发放奖励（核心变更）
        rewardPool.distributeReward(msg.sender, amount);
        emit RewardClaimed(airdropId, msg.sender, amount, block.timestamp);
    }

    /**
     * @dev 检查地址是否已领取奖励
     */
    function isClaimed(
        uint256 airdropId,
        address user
    ) external view returns (bool) {
        return claimed[airdropId][user];
    }

    /**
    @dev 获取空投活动信息（包含奖励池余额参考）
    */
    function getAirdropInfo(
        uint256 airdropId
    )
        external
        view
        returns (
            string memory name,
            bytes32 merkleRoot,
            uint256 totalReward,
            uint256 claimedReward,
            uint256 remainingReward, // 活动剩余额度
            uint256 poolBalance, // 奖励池当前余额
            uint256 startTime,
            uint256 endTime,
            bool isActive
        )
    {
        Airdrop storage airdrop = airdrops[airdropId];
        return (
            airdrop.name,
            airdrop.merkleRoot,
            airdrop.totalReward,
            airdrop.claimedReward,
            airdrop.totalReward - airdrop.claimedReward,
            rewardPool.getPoolBalance(),
            airdrop.startTime,
            airdrop.endTime,
            airdrop.isActive
        );
    }

    /**
     * @dev UUPS升级授权（仅所有者）
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
