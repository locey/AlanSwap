// 引入 Hardhat Ignition 核心模块和类型
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
// 引入 ethers 用于时间计算（可选，用于设置锁定期）
const { ethers } = require("hardhat");
module.exports = buildModule("StakeModule", (m) => {
    //部署 Stake 合约
    const stake = m.contract("Stake", []);
    // 初始化 Stake 合约
    const initializeTx = m.call(stake, "initialize", []);
    //2. 获取部署者地址（作为初始管理员和升级者）
    // m.getAccount(0) 表示 Hardhat 配置中的第一个账户（需确保该账户在 Sepolia 有 ETH 用于部署）
    const deployer = m.getAccount(0);
    //3. 设置管理员和升级者
    return {
        stake, // Stake 代理合约地址（用户交互用这个地址）
        stakeImplementation: m.getImplementationAddress(stake), // Stake 实现合约地址（升级用）
        deployer, // 部署者地址（初始管理员和升级者）
        initializeTx, // 初始化交易（确保在部署后调用） 
    };
});