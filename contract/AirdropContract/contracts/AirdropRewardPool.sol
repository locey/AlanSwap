// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./CSWAPToken.sol";

/**
 * @title AirdropRewardPool
 * @dev 奖励池合约，用于管理CSWAP奖励的分配和发放
 */
contract AirdropRewardPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // 奖励代币
    CSWAPToken public rewardToken;
    // 授权的空投发放者（仅空投合约）
    mapping(address => bool) public authorizedAirdrops;
    // 事件
    event AirdropAuthorized(address indexed airdropContract);
    event AirdropRevoked(address indexed airdropContract);
    event RewardDistributed(
        address indexed recipient,
        address indexed airdropContract,
        uint256 amount
    );

    event TokensDeposited(address indexed depositor, uint256 amount);


    function initialize(address _rewardToken) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
         require(_rewardToken != address(0), "Invalid token address");
        rewardToken = CSWAPToken(_rewardToken);
    }
    /**
    @dev 授权空投合约（仅所有者）
    @param airdropContract 空投合约地址（需为 UUPS 代理地址）
    */
    function authorizeAirdrop(address airdropContract) external onlyOwner {
        require(airdropContract != address(0), "Invalid airdrop address");
        require(!authorizedAirdrops[airdropContract], "Already authorized");
        authorizedAirdrops[airdropContract] = true;
        emit AirdropAuthorized(airdropContract);
    }
    /**
    @dev 撤销空投合约授权（仅所有者）
    @param airdropContract 空投合约地址
    */
    function revokeAirdrop(address airdropContract) external onlyOwner {
        require(authorizedAirdrops[airdropContract], "Not authorized");
        authorizedAirdrops[airdropContract] = false;
        emit AirdropRevoked(airdropContract);
    }
    /**
    @dev 向奖励池存入代币（任何人可存入，用于补充奖励）
    @param amount 存入数量（代币精度）
    */
    function depositTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        // 从存入者地址转账到奖励池
        bool success = rewardToken.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(success, "Token transfer failed");
        emit TokensDeposited(msg.sender, amount);
    }
    /**
    @dev 发放奖励（仅授权的空投合约可调用）
    @param recipient 奖励接收者地址
    @param amount 奖励数量
    */
    function distributeReward(
        address recipient,
        uint256 amount
    ) external nonReentrant {
        require(authorizedAirdrops[msg.sender], "Not authorized airdrop");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(
            rewardToken.balanceOf(address(this)) >= amount,
            "Insufficient pool balance"
        );
        // 从奖励池转账到用户
        bool success = rewardToken.transfer(recipient, amount);
        require(success, "Reward transfer failed");
        emit RewardDistributed(recipient, msg.sender, amount);
    }
    /**
    @dev 获取奖励池当前余额
    */
    function getPoolBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
    /**
    @dev UUPS 升级授权（仅所有者）
    */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
