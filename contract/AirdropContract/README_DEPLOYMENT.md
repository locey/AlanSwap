# CSWAP 空投合约部署指南

## 🚀 快速开始

### 1. 环境准备

#### 1.1 安装依赖
```bash
npm install
```

#### 1.2 配置环境变量
创建 `.env` 文件：
```bash
# Infura API Key (从 https://infura.io 获取)
INFURA_API_KEY=your_infura_api_key_here

# 部署者私钥 (不要包含0x前缀)
PK=your_private_key_here

# Etherscan API Key (用于合约验证，可选)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Gas报告设置
REPORT_GAS=true
```

#### 1.3 获取测试网ETH
- 访问 [Sepolia Faucet](https://sepoliafaucet.com/) 获取测试网ETH
- 确保部署者账户有至少0.1 ETH

### 2. 部署到Sepolia

#### 2.1 编译合约
```bash
npx hardhat compile
```

#### 2.2 部署合约
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

部署完成后会生成 `deployments/sepolia.json` 文件，包含所有合约地址。

### 3. 测试空投功能

#### 3.1 运行测试脚本
```bash
npx hardhat run scripts/testAirdrop.js --network sepolia
```

#### 3.2 监听事件
```bash
npx hardhat run scripts/eventListener.js --network sepolia
```

## 📋 白名单账户

当前白名单包含2个测试账户，总奖励500CSWAP：

| 地址 | 奖励金额 |
|------|----------|
| 0x61dDeA492e49DdA284efe85C55872AF4b88cc911 | 300 CSWAP |
| 0x020875Bf393a9CFC00B75a4F7b07576BAA4248F4 | 200 CSWAP |

## 🔍 事件监听

后端可以通过监听以下事件来跟踪空投活动：

### 空投相关事件
-空投活动创建 `AirdropCreated(uint256 indexed airdropId, string name, bytes32 merkleRoot, uint256 totalReward, uint256 treeVersion)` - 
-空投活动激活 `AirdropActivated(uint256 indexed airdropId)`
-用户领取奖励 `RewardClaimed(uint256 indexed airdropId, address indexed user, uint256 claimAmount, uint256 totalReward, uint256 claimedReward, uint256 pendingReward, uint256 timestamp)` 
- `MerkleRootUpdated(uint256 indexed airdropId, bytes32 newRoot, uint32 newVersion)`

### 代币相关事件
-代币转账 `Transfer(address indexed from, address indexed to, uint256 value)` 
-代币增发 `TokensMinted(address indexed to, uint256 amount)`  
- `BatchTokensMinted(address indexed operator, uint256 totalAmount)`

### 奖励池相关事件
- `TokensDeposited(address indexed depositor, uint256 amount)`
-奖励发放 `RewardDistributed(address indexed recipient, address indexed airdropContract, uint256 amount)`
- `AirdropAuthorized(address indexed airdropContract)`
- `AirdropRevoked(address indexed airdropContract)`

## 🛠️ 合约功能

### CSWAPToken (ERC20代币)
- 总供应量：1亿枚
- 支持暂停/恢复转账
- 支持批量增发
- 支持重入攻击保护

### AirdropRewardPool (奖励池)
- 可升级合约 (UUPS)
- 管理空投奖励发放
- 支持代币存入
- 授权机制控制

### MerkleAirdrop (空投合约)
- 可升级合约 (UUPS)
- 基于默克尔树的空投
- 支持分批领取
- 支持默克尔根更新

## 📊 部署后状态

部署完成后：
- 空投活动将在5分钟后自动激活
- 活动持续30天
- 总奖励池：100万CSWAP
- 空投总奖励：1万CSWAP

## 🔧 故障排除

### 常见问题

1. **部署失败 - 余额不足**
   - 确保账户有足够的ETH支付gas费用

2. **部署失败 - 网络连接问题**
   - 检查Infura API密钥是否正确
   - 确认网络连接正常

3. **合约验证失败**
   - 检查Etherscan API密钥
   - 确认合约地址正确

### 获取帮助

如果遇到问题，请检查：
1. 环境变量配置是否正确
2. 网络连接是否正常
3. 账户余额是否充足
4. 合约编译是否成功
