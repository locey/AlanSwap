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
        uint256 treeVersion; // 默克尔树版本（用于后续奖励更新）
    }

    //记录每个用户已经领取的奖励、待领取的奖励以及总奖励
    struct UserRewardInfo {
        uint256 totalReward; // 总奖励数量
        uint256 claimedReward; // 已领取奖励数量
        uint256 pendingReward; // 待领取奖励数量
        bool hasRecord; // 是否存在该用户的奖励记录（避免默认值混淆）
        uint32 lastVersion; // 最后一次领取时的树版本（防跨版本重复领取）
    }

    // 空投活动
    mapping(uint256 => Airdrop) public airdrops; // 活动ID => 活动信息

    // 活动ID => 地址 => 是否已领取
    mapping(uint256 => mapping(address => bool)) public claimed;

    // 活动计数器，用于活动id的累加生成
    uint256 public airdropCount;

    // 用户奖励记录
    mapping(uint256 => mapping(address => UserRewardInfo)) public userRewards;

    // ------事件-----
    //空投创建
    event AirdropCreated(
        uint256 indexed airdropId,
        string name,
        bytes32 merkleRoot,
        uint256 totalReward,
        uint256 treeVersion
    );

    //空投激活
    event AirdropActivated(uint256 indexed airdropId);

    //空投奖励领取
    event RewardClaimed(
        uint256 indexed airdropId,
        address indexed user,
        uint256 claimAmount, // 本次领取金额
        uint256 totalReward, // 用户总奖励
        uint256 claimedReward, // 用户已领取奖励（更新后）
        uint256 pendingReward, // 用户待领取奖励（更新后）
        uint256 timestamp
    );

    //更新用户总奖励
    event UpdateTotalRewardUpdated(
        uint256 indexed airdropId,
        address indexed user,
        uint256 totalReward,
        uint256 claimedReward,
        uint256 pendingReward, // 更新后的待领取奖励
        uint256 timestamp
    );

    //更新中央奖励池
    event RewardPoolUpdated(address indexed oldPool, address indexed newPool);

    //默克尔根更新
    event MerkleRootUpdated(
        uint256 indexed airdropId,
        bytes32 newRoot,
        uint32 newVersion
    );

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

    //必须添加的辅助函数：计算叶子节点哈希（与 claimReward 中逻辑一致）
    function calculateLeafHash(
        address user,
        uint256 amount
    ) external pure returns (bytes32) {
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
        uint256 endTime,
        uint256 treeVersion //默克尔树版本（首次创建传1，后续更新传+1）
    ) external onlyOwner {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(totalReward > 0, "Total reward must be > 0");
        // require(startTime >= block.timestamp, "Start time in future");  //注釋這句代碼，允许创建未来的空投
        require(endTime > startTime, "End time after start time");
        // 正确检查奖励池余额（关键修正）
        require(
            rewardPool.getPoolBalance() >= totalReward,
            "Insufficient contract balance"
        );
        uint256 airdropId = airdropCount;
        airdrops[airdropId] = Airdrop({
            id: airdropId,
            name: name,
            merkleRoot: merkleRoot,
            totalReward: totalReward,
            claimedReward: 0,
            startTime: startTime,
            endTime: endTime,
            isActive: false,
            treeVersion: treeVersion
        });

        airdropCount++;
        emit AirdropCreated(
            airdropId,
            name,
            merkleRoot,
            totalReward,
            treeVersion
        );
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
        uint256 amount, //本次领取金额
        uint256 totalReward, //用户在该空投中的总奖励（需与默克尔树匹配）
        bytes32[] calldata proof //默克尔证明
    ) external nonReentrant {
        Airdrop storage airdrop = airdrops[airdropId];
        require(airdrop.id == airdropId, "Airdrop not exists");
        require(airdrop.isActive, "Airdrop not active");
        require(
            block.timestamp >= airdrop.startTime &&
                block.timestamp <= airdrop.endTime,
            "Airdrop not in period"
        );
        require(amount > 0 && amount <= totalReward, "Invalid claim amount");
        UserRewardInfo storage userRewardInfo = userRewards[airdropId][
            msg.sender
        ];

        //首次领取
        if (!userRewardInfo.hasRecord) {
            //  验证默克尔证明  这里由于默克尔证明是基于总奖励金额的，所以需要先计算出总奖励金额
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender, totalReward));
            bool isValid = MerkleProofUpgradeable.verify(
                proof,
                airdrop.merkleRoot,
                leaf
            );
            require(isValid, "Invalid merkle proof");
            //这里更新用户奖励信息
            userRewardInfo.totalReward = totalReward;
            userRewardInfo.claimedReward = 0;
            userRewardInfo.pendingReward = amount;
            userRewardInfo.hasRecord = true;
        } else {
            //非首次领取时校验传入的总奖励与已有记录是否一致
            require(
                userRewardInfo.totalReward == totalReward,
                "total reward mismatch with record"
            );
        }

        // 检查活动额度和奖励池余额
        require(
            airdrop.claimedReward + amount <= airdrop.totalReward,
            "Exceed airdrop total reward"
        );
        require(
            rewardPool.getPoolBalance() >= amount,
            "Insufficient pool balance for reward"
        );
        //本次领取应小于等于待领取金额
        require(
            amount <=
                (userRewardInfo.totalReward - userRewardInfo.claimedReward),
            "Exceed pending reward"
        );

        //  更新本地状态
        userRewardInfo.claimedReward += amount;
        claimed[airdropId][msg.sender] = true;
        airdrop.claimedReward += amount;
        //  调用中央奖励池发放奖励
        // rewardPool.distributeReward(msg.sender, amount);
        (bool success, ) = address(rewardPool).call(
            abi.encodeWithSignature(
                "distributeReward(address,uint256)",
                msg.sender,
                amount
            )
        );
        require(success, "Reward distribution failed");
        //计算更新后的待领取奖励
        uint256 updatedPendingReward = userRewardInfo.totalReward -
            userRewardInfo.claimedReward;

        emit RewardClaimed(
            airdropId,
            msg.sender,
            amount,
            userRewardInfo.totalReward,
            userRewardInfo.claimedReward,
            updatedPendingReward,
            block.timestamp
        );
    }

    /**
     * @dev 管理员更新默克尔根（新增白名单用户的核心接口）
     * @param airdropId 空投ID
     * @param newRoot 新的默克尔根（包含新增用户）
     * @param newVersion 新版本号（必须比当前版本大）
     */
    function updateMerkleRoot(
        uint256 airdropId,
        bytes32 newRoot,
        uint32 newVersion
    ) external onlyOwner {
        Airdrop storage info = airdrops[airdropId];
        // 校验：新版本号必须递增（防止回滚）
        require(newVersion > info.treeVersion, "Version must be higher");
        // 校验：空投未结束
        require(block.timestamp < info.endTime, "Airdrop already ended");

        // 更新默克尔根和版本号
        info.merkleRoot = newRoot;
        info.treeVersion = newVersion;

        emit MerkleRootUpdated(airdropId, newRoot, newVersion);
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
     * @dev 查询空投剩余奖励（链下统计用）
     * @param airdropId 空投ID
     * @return remainingReward 空投剩余总奖励
     */
    function getAirdropRemainingReward(
        uint256 airdropId
    ) external view returns (uint256) {
        Airdrop storage airdrop = airdrops[airdropId];
        require(airdrop.id == airdropId, "Airdrop not exists");
        return airdrop.totalReward - airdrop.claimedReward;
    }

    /**
     * @dev 查询用户奖励状态（前端/链下调用，避免多次查询映射）
     * @param airdropId 空投ID
     * @param user 用户地址
     * @return totalReward 总奖励
     * @return claimedReward 已领取奖励
     * @return pendingReward 待领取奖励
     * @return hasRecord 是否有奖励记录
     */
    function getUserRewardStatus(
        uint256 airdropId,
        address user
    )
        external
        view
        returns (
            uint256 totalReward,
            uint256 claimedReward,
            uint256 pendingReward,
            bool hasRecord
        )
    {
        Airdrop storage airdrop = airdrops[airdropId];
        require(airdrop.id == airdropId, "Airdrop not exists");
        UserRewardInfo storage userReward = userRewards[airdropId][user];
        totalReward = userReward.totalReward;
        claimedReward = userReward.claimedReward;
        pendingReward = totalReward - claimedReward;
        hasRecord = userReward.hasRecord;
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
