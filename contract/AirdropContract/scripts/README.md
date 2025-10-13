# Scripts 目录说明

本目录包含空投合约的核心脚本，每个脚本都有明确的用途。

## 📋 脚本列表

### 1. `deploy.js` - 部署脚本
**用途：** 部署所有合约到指定网络
**用法：**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
**功能：**
- 部署 CSWAPToken、AirdropRewardPool、MerkleAirdrop 合约
- 初始化合约关系
- 创建空投活动
- 保存部署记录

### 2. `eventListener.js` - 事件监听器
**用途：** 实时监听智能合约事件
**用法：**
```bash
npx hardhat run scripts/eventListener.js --network sepolia
```
**监听事件：**
- AirdropCreated - 空投活动创建
- AirdropActivated - 空投活动激活
- RewardClaimed - 用户领取奖励
- MerkleRootUpdated - 默克尔根更新
- TokensDeposited - 代币存入奖励池
- RewardDistributed - 奖励发放
- Transfer - 代币转账
- TokensMinted - 代币增发

### 3. `getAddresses.js` - 获取合约地址
**用途：** 显示已部署的合约地址
**用法：**
```bash
npx hardhat run scripts/getAddresses.js --network sepolia
```
**功能：**
- 从 OpenZeppelin 部署记录中提取合约地址
- 显示代理合约和实现合约地址

### 4. `testAirdrop.js` - 测试空投功能
**用途：** 测试空投合约的基本功能
**用法：**
```bash
npx hardhat run scripts/testAirdrop.js --network sepolia
```
**功能：**
- 检查空投活动状态
- 生成默克尔证明
- 显示用户奖励信息
- 提供领取参数

## 🎯 使用场景

### 部署新环境
```bash
# 1. 部署合约
npx hardhat run scripts/deploy.js --network sepolia

# 2. 验证部署
npx hardhat run scripts/getAddresses.js --network sepolia

# 3. 测试功能
npx hardhat run scripts/testAirdrop.js --network sepolia
```

### 后端开发
```bash
# 启动事件监听器
npx hardhat run scripts/eventListener.js --network sepolia
```

### 日常维护
```bash
# 检查合约状态
npx hardhat run scripts/testAirdrop.js --network sepolia

# 获取合约地址
npx hardhat run scripts/getAddresses.js --network sepolia
```

## 📝 注意事项

1. **网络配置：** 确保 `.env` 文件中配置了正确的网络参数
2. **私钥安全：** 部署脚本需要部署者私钥，请妥善保管
3. **Gas 费用：** 部署和操作需要支付 gas 费用
4. **白名单文件：** 确保 `whitelist.json` 文件存在且格式正确

## 🔧 扩展功能

如需添加新的测试脚本，建议：
1. 功能明确，避免重复
2. 包含完整的错误处理
3. 提供清晰的输出信息
4. 遵循现有的代码风格
