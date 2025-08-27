// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
//可升级合约必须使用Upgradeable版本，单一权限使用Ownable即可
//import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
//只使用转账则使用ERC20，如果自身实现ERC20则需要使用Upgradeable版本
//import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20 }from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//增加防重入保护
//import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
//使用可升级合约时，必须使用Upgradeable版本
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
//权限控制
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
//升级合约权限控制
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
//UUPS升级合约
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
//暂停/恢复合约功能
//import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
//可升级合约时，必须使用Upgradeable版本
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
//引入oracle接口
import "./lib/DataFeed.sol";

//暂未使用安全方式
//using SafeERC20 for ERC20;

contract Stake is ReentrancyGuardUpgradeable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    //设置升级管理员
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    //设置一般管理员
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    //pool id => user address => user info
    mapping (uint256 => mapping (address => User)) public users;
    Pool[] public pools;

    // 每日shareprice记录，按日期存储
    //目前所有的池子，统一涨幅，理论应该是每个池子有每个池子的涨幅
    mapping(uint256 => uint256) public dailySharePrices; // date => price
    uint256[] public priceDates; // 存储所有有价格记录的日期，用于遍历
    struct Pool {
        //池子ID
        uint256 id;
        //池子名称
        string poolName;
        //池子对应的地址，如果是ETH，则是zero
        address tokenAddress;
        //锁定时间
        uint256 lockDuration;//精确到秒
        //质押总量
        uint256 amountTotal;
        // 是否激活池子
        bool isActive; 
        //预言机地址
        address oracleDataFeedAddress;
    }
    struct UserInfoWithExtra {
        //质押的数量
        uint256 amountTotal;
        //待领取奖励
        uint256 unclaimedRewards;
        //质押记录
        StakeRecord[] stakes;
        //折合总价值，单位USD，8位小数
        uint256 totol;
        
    }
    struct User {
        //质押的数量
        uint256 amountTotal;
        //待领取奖励
        uint256 unclaimedRewards;
        //质押记录
        StakeRecord[] stakes;
    }

    struct StakeRecord {
        //质押的数量
        uint256 amount;
        //用户在这个池子质押时间
        uint256 stakedAt;
        //解除质押时间
        uint256 unlockTime;
        //初始shareprice
        uint256 initialSharePrice;
    }

    event PoolCreated(uint256 indexed poolId, address indexed token, uint256 lockDuration, string name);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 stakedAt, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 indexed poolId, uint256 amount, uint256 reward, uint256 withdrawnAt);
    event ClaimRewards(address indexed user, uint256 indexed poolId, uint256 reward, uint256 claimedAt);
    event SharePriceUpdated(uint256 date, uint256 price);

    function initialize() public initializer {
        // 1. 初始化最基础的 ContextUpgradeable（所有权限合约的父合约）
        __Context_init_unchained();
        // 2. 初始化防重入保护（ReentrancyGuardUpgradeable）
        __ReentrancyGuard_init_unchained();
        // 3. 初始化暂停功能（PausableUpgradeable）
        __Pausable_init_unchained();
        // 4. 初始化权限控制（AccessControlUpgradeable）
        __AccessControl_init_unchained();
        // 5. 初始化 UUPS 升级功能（UUPSUpgradeable）
        __UUPSUpgradeable_init_unchained();
        // 部署者获得所有初始角色
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        //_grantRole(DEFAULT_ADMIN_ROLE, msg.sender); //设置默认管理员
        //初始每日shareprice
        uint256 today = timestampToDate(block.timestamp);
        dailySharePrices[today] = 1000; // 初始价格设为1000
        priceDates.push(today);
    }
    //*******************管理员功能  start***************************************** 
    function timestampToDate(uint256 timestamp) internal pure returns (uint256) {
        return timestamp / 1 days * 1 days;
    }

    function setDailySharePrice(uint256 date, uint256 price) external onlyRole(ADMIN_ROLE) {
        require(date > 0, "Date must be greater than zero");
        require(price > 0, "Price must be greater than zero");
        date = timestampToDate(date);
        //只能是当天设置当天的价格，不能设置未来的价格
        require(date <= timestampToDate(block.timestamp), "Cannot set price for future dates");
        require(priceDates[priceDates.length-1] < date, "Cannot set price for past dates");
        if(dailySharePrices[date] == 0){
            priceDates.push(date);
        }
        dailySharePrices[date] = price;
        emit SharePriceUpdated(date, price);
    }

    //输入池子id，池子名称，池子地址（如果是ETH则为0x0），锁定时间
    function addPool(string calldata _poolName, address _tokenAddress,uint256 _lockDuration,address oracleDataFeedAddress) external onlyRole(ADMIN_ROLE) {
        require(_lockDuration > 0, "pool id must be greater than zero");
        require(bytes(_poolName).length > 0, "Pool name cannot be empty");
        require(_lockDuration > 0, "Stake time must be greater than zero");
        require(oracleDataFeedAddress != address(0), "oracleDataFeedAddress cannot be zero address");
        //设置池子id，从0开始自增
        pools.push(Pool({
            id: pools.length,
            poolName: _poolName,
            tokenAddress: _tokenAddress,
            lockDuration: _lockDuration,
            amountTotal: 0,
            isActive: true,
            oracleDataFeedAddress: oracleDataFeedAddress
        }));
        emit PoolCreated(pools.length - 1, _tokenAddress, _lockDuration, _poolName);
    }

    function getPools() external view returns (Pool[] memory) {
        return pools;
    }
    
    function setPoolActive(uint256 _poolId, bool _isActive) external onlyRole(ADMIN_ROLE) {
        require(_poolId < pools.length, "Invalid pool ID");
        pools[_poolId].isActive = _isActive;
    }
    //暂停合约
    function pause() external onlyRole(ADMIN_ROLE) whenNotPaused{
        _pause();
    }
    //恢复合约
    function unpause() external onlyRole(ADMIN_ROLE) whenPaused{
        _unpause();
    }

    //*******************管理员功能   end***************************************** 
    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    //*******************升级合约*************************************************
    //获取用户在某个池子的质押信息
    function getUserInfo(uint256 _poolId) external view returns (UserInfoWithExtra memory) {
        require(_poolId < pools.length, "Invalid pool ID");
        Pool storage pool_ = pools[_poolId];
        int256 price = DataFeed.getDataFeed(pool_.oracleDataFeedAddress);
        User storage user_ = users[_poolId][msg.sender];
        uint256 totol = 0;
        if (pool_.tokenAddress == address(0)) {
            //如果是ETH池子，直接返回质押数量
            totol = uint256(price) * user_.amountTotal / 1e18 / 1e8;
        }else{
            //如果是ERC20池子，返回质押数量 * 代币价格 / 1e8
            totol = uint256(price) * user_.amountTotal / (10 **ERC20(pool_.tokenAddress).decimals()) / 1e8;
        }
        return UserInfoWithExtra({
            amountTotal: user_.amountTotal,
            unclaimedRewards: user_.unclaimedRewards,
            stakes: user_.stakes,
            totol: totol
        });
    }
    function depositEth(uint256 _poolId) public payable nonReentrant whenNotPaused{
        require(_poolId < pools.length, "Invalid pool ID");
        require(msg.value > 0, "Staking amount must be greater than zero");
        require(pools[_poolId].tokenAddress == address(0), "Pool is not for ETH staking");
        require(pools[_poolId].isActive, "Pool is not active");
        _deposit(_poolId,msg.value);
    }

    function deposit(uint256 _poolId,uint256 _amount) public nonReentrant whenNotPaused{
        require(_amount > 0, "Staking amount must be greater than zero");
        Pool storage pool_ = pools[_poolId];
        require(pool_.isActive, "Pool is not active");
        ERC20(pool_.tokenAddress).transferFrom(msg.sender, address(this), _amount);
        _deposit(_poolId,_amount);
    }
    function _deposit(uint256 _poolId,uint256 _amount) internal {
        Pool storage pool_ = pools[_poolId];
        User storage user = users[_poolId][msg.sender];
        user.amountTotal += _amount;
        pool_.amountTotal += _amount;
        user.stakes.push(StakeRecord({
            amount: _amount,
            stakedAt: block.timestamp,
            unlockTime: block.timestamp + pool_.lockDuration,
            initialSharePrice: dailySharePrices[timestampToDate(block.timestamp)]
        }));

        emit Staked(msg.sender, _poolId, _amount, block.timestamp, block.timestamp + pool_.lockDuration);
    }
    function withdraw(uint256 _poolId,uint256 _amount) public nonReentrant whenNotPaused{
        require(_amount > 0, "Withdraw amount must be greater than zero");
        User storage user = users[_poolId][msg.sender];
        require(user.amountTotal >= _amount, "Insufficient staked amount");
        Pool storage pool_ = pools[_poolId];
        uint256 remainingAmount = _amount;
        for (uint256 i = 0; i < user.stakes.length && remainingAmount > 0; i++) {
            StakeRecord storage record = user.stakes[i];
            if (block.timestamp >= record.unlockTime) {
                if (record.amount <= remainingAmount) {
                    remainingAmount -= record.amount;
                    user.unclaimedRewards += calculateRewards(record);
                    record.amount = 0;
                } else {
                    record.amount -= remainingAmount;
                    user.unclaimedRewards += calculateRewards(record);
                    remainingAmount = 0;
                }
            }else{
                //如果遇到第一个未解锁的记录，直接跳出循环
                break;
            }
        }
        require(remainingAmount == 0, "Not enough unlocked stakes to withdraw the requested amount");
        user.amountTotal -= _amount;
        pool_.amountTotal -= _amount;
        if(pool_.tokenAddress == address(0)){
            payable(msg.sender).transfer(_amount);
        }else{
            ERC20(pool_.tokenAddress).transfer(msg.sender, _amount);
        }
        emit Withdrawn(msg.sender, _poolId, _amount, user.unclaimedRewards, block.timestamp);
    }
    function calculateRewards(StakeRecord memory record) internal view returns (uint256) {
        uint256 endDate = timestampToDate(block.timestamp);
        uint256 dailyPrice = dailySharePrices[endDate];
        //总额 * (提取价格 - 初始价格) / 初始价格
        //50ETH * (1100 - 1000) / 1000  = 50 * 10%
        uint256 totalRewards = record.amount * (dailyPrice - record.initialSharePrice) / record.initialSharePrice;
        return totalRewards;
    }
    function claimRewards(uint256 _poolId) public nonReentrant whenNotPaused{
        User storage user = users[_poolId][msg.sender];
        require(user.unclaimedRewards > 0, "No rewards to claim");
        uint256 rewards = user.unclaimedRewards;
        user.unclaimedRewards = 0;
        Pool storage pool_ = pools[_poolId];
        if(pool_.tokenAddress == address(0)){
            payable(msg.sender).transfer(rewards);
        }else{
            ERC20(pool_.tokenAddress).transfer(msg.sender, rewards);
        }
        emit ClaimRewards(msg.sender, _poolId, rewards, block.timestamp);
    }
}
