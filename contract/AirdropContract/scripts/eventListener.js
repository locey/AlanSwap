const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 事件监听示例 - 供后端项目参考
 */
async function setupEventListeners() {
  console.log("\n👂 设置事件监听器...");
  
  // 读取部署记录
  const deploymentFile = path.join(__dirname, "../deployments/sepolia.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("部署记录文件不存在，请先部署合约");
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  // 从 OpenZeppelin 部署记录中提取代理地址
  if (!deployment.proxies || deployment.proxies.length < 2) {
    throw new Error("部署记录格式错误，缺少代理合约地址");
  }
  
  // 根据部署顺序获取地址：
  // proxies[0] 是 AirdropRewardPool
  // proxies[1] 是 MerkleAirdrop
  const rewardPoolAddress = deployment.proxies[0].address;
  const merkleAirdropAddress = deployment.proxies[1].address;
  
  console.log(`📋 AirdropRewardPool 合约地址: ${rewardPoolAddress}`);
  console.log(`📋 MerkleAirdrop 合约地址: ${merkleAirdropAddress}`);
  
  // 获取合约实例
  const merkleAirdrop = await ethers.getContractAt("MerkleAirdrop", merkleAirdropAddress);
  const rewardPool = await ethers.getContractAt("AirdropRewardPool", rewardPoolAddress);
  
  // 尝试从奖励池合约获取代币地址
  let cswapTokenAddress;
  try {
    cswapTokenAddress = await rewardPool.rewardToken();
    console.log(`📋 CSWAPToken 合约地址: ${cswapTokenAddress}`);
  } catch (error) {
    console.log("⚠️  无法从奖励池获取代币地址，请手动指定");
    throw new Error("需要手动指定 CSWAPToken 地址");
  }
  
  const cswapToken = await ethers.getContractAt("CSWAPToken", cswapTokenAddress);
  
  console.log("📡 开始监听事件...");
  
  // 1. 监听空投活动创建
  merkleAirdrop.on("AirdropCreated", (airdropId, name, merkleRoot, totalReward, treeVersion, event) => {
    console.log("\n🎯 空投活动创建:");
    console.log(`   ID: ${airdropId}`);
    console.log(`   名称: ${name}`);
    console.log(`   默克尔根: ${merkleRoot}`);
    console.log(`   总奖励: ${ethers.formatEther(totalReward)} CSWAP`);
    console.log(`   树版本: ${treeVersion}`);
    console.log(`   区块: ${event.blockNumber}`);
    console.log(`   交易: ${event.transactionHash}`);
  });
  
  // 2. 监听空投活动激活
  merkleAirdrop.on("AirdropActivated", (airdropId, event) => {
    console.log("\n🚀 空投活动激活:");
    console.log(`   ID: ${airdropId}`);
    console.log(`   区块: ${event.blockNumber}`);
    console.log(`   交易: ${event.transactionHash}`);
  });
  
  // 3. 监听用户领取奖励
  merkleAirdrop.on("RewardClaimed", (airdropId, user, claimAmount, totalReward, claimedReward, pendingReward, timestamp, event) => {
    console.log("\n💰 用户领取奖励:");
    console.log(`   空投ID: ${airdropId}`);
    console.log(`   用户: ${user}`);
    console.log(`   本次领取: ${ethers.formatEther(claimAmount)} CSWAP`);
    console.log(`   总奖励: ${ethers.formatEther(totalReward)} CSWAP`);
    console.log(`   已领取: ${ethers.formatEther(claimedReward)} CSWAP`);
    console.log(`   待领取: ${ethers.formatEther(pendingReward)} CSWAP`);
    console.log(`   时间戳: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    console.log(`   区块: ${event.blockNumber}`);
    console.log(`   交易: ${event.transactionHash}`);
  });
  
  // 4. 监听默克尔根更新
  merkleAirdrop.on("MerkleRootUpdated", (airdropId, newRoot, newVersion, event) => {
    console.log("\n🌳 默克尔根更新:");
    console.log(`   空投ID: ${airdropId}`);
    console.log(`   新根: ${newRoot}`);
    console.log(`   新版本: ${newVersion}`);
    console.log(`   区块: ${event.blockNumber}`);
    console.log(`   交易: ${event.transactionHash}`);
  });
  
  // 5. 监听奖励池代币存入
  rewardPool.on("TokensDeposited", (depositor, amount, event) => {
    console.log("\n💳 奖励池代币存入:");
    console.log(`   存入者: ${depositor}`);
    console.log(`   金额: ${ethers.formatEther(amount)} CSWAP`);
    console.log(`   区块: ${event.blockNumber}`);
    console.log(`   交易: ${event.transactionHash}`);
  });
  
  // 6. 监听奖励发放
  rewardPool.on("RewardDistributed", (recipient, airdropContract, amount, event) => {
    console.log("\n🎁 奖励发放:");
    console.log(`   接收者: ${recipient}`);
    console.log(`   空投合约: ${airdropContract}`);
    console.log(`   金额: ${ethers.formatEther(amount)} CSWAP`);
    console.log(`   区块: ${event.blockNumber}`);
    console.log(`   交易: ${event.transactionHash}`);
  });
  
  // 7. 监听代币转账
  cswapToken.on("Transfer", (from, to, amount, event) => {
    console.log("\n🔄 代币转账:");
    console.log(`   从: ${from}`);
    console.log(`   到: ${to}`);
    console.log(`   金额: ${ethers.formatEther(amount)} CSWAP`);
    console.log(`   区块: ${event.blockNumber}`);
    console.log(`   交易: ${event.transactionHash}`);
  });
  
  // 8. 监听代币增发
  cswapToken.on("TokensMinted", (to, amount, event) => {
    console.log("\n🪙 代币增发:");
    console.log(`   接收者: ${to}`);
    console.log(`   金额: ${ethers.formatEther(amount)} CSWAP`);
    console.log(`   区块: ${event.blockNumber}`);
    console.log(`   交易: ${event.transactionHash}`);
  });
  
  console.log("✅ 所有事件监听器已设置完成");
  console.log("💡 按 Ctrl+C 停止监听");
  
  // 保持程序运行
  process.on('SIGINT', () => {
    console.log("\n👋 停止事件监听");
    process.exit(0);
  });
}

// 执行事件监听
setupEventListeners()
  .catch((error) => {
    console.error("\n❌ 事件监听设置失败:", error.message);
    process.exit(1);
  });
