const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

/**
 * 测试空投领取功能
 */
async function testAirdropClaim() {
  console.log("\n🧪 开始测试空投领取功能...");
  
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
  
  // 获取合约实例
  const merkleAirdrop = await ethers.getContractAt("MerkleAirdrop", merkleAirdropAddress);
  const rewardPool = await ethers.getContractAt("AirdropRewardPool", rewardPoolAddress);
  
  // 从奖励池合约获取代币地址
  const cswapTokenAddress = await rewardPool.rewardToken();
  const cswapToken = await ethers.getContractAt("CSWAPToken", cswapTokenAddress);
  
  console.log(`📋 合约地址:`);
  console.log(`   MerkleAirdrop: ${merkleAirdropAddress}`);
  console.log(`   AirdropRewardPool: ${rewardPoolAddress}`);
  console.log(`   CSWAPToken: ${cswapTokenAddress}`);
  
  // 读取白名单数据
  const whitelistFile = path.join(__dirname, "../whitelist.json");
  const whitelistData = JSON.parse(fs.readFileSync(whitelistFile, "utf8"));
  
  // 生成默克尔树
  const leaves = whitelistData.map(item => {
    const address = ethers.getAddress(item.address);
    const amount = ethers.parseEther(item.amount.toString());
    return ethers.solidityPackedKeccak256(["address", "uint256"], [address, amount]);
  });
  
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  
  // 测试第一个白名单账户
  const testAccount = whitelistData[0];
  const testAddress = ethers.getAddress(testAccount.address);
  const testAmount = ethers.parseEther(testAccount.amount.toString());
  
  console.log(`\n📋 测试账户: ${testAddress}`);
  console.log(`💰 可领取金额: ${testAccount.amount} CSWAP`);
  
  // 生成默克尔证明
  const leaf = ethers.solidityPackedKeccak256(["address", "uint256"], [testAddress, testAmount]);
  const proof = merkleTree.getProof(leaf).map(p => `0x${p.data.toString("hex")}`);
  
  console.log(`🔍 默克尔证明: ${proof.length} 个节点`);
  
  // 检查空投状态
  const airdropInfo = await merkleAirdrop.getAirdropInfo(0);
  console.log(`\n📊 空投活动信息:`);
  console.log(`   名称: ${airdropInfo.name}`);
  console.log(`   总奖励: ${ethers.formatEther(airdropInfo.totalReward)} CSWAP`);
  console.log(`   已领取: ${ethers.formatEther(airdropInfo.claimedReward)} CSWAP`);
  console.log(`   剩余: ${ethers.formatEther(airdropInfo.remainingReward)} CSWAP`);
  console.log(`   奖励池余额: ${ethers.formatEther(airdropInfo.poolBalance)} CSWAP`);
  console.log(`   是否激活: ${airdropInfo.isActive}`);
  console.log(`   开始时间: ${new Date(Number(airdropInfo.startTime) * 1000).toLocaleString()}`);
  console.log(`   结束时间: ${new Date(Number(airdropInfo.endTime) * 1000).toLocaleString()}`);
  
  // 检查用户状态
  const userStatus = await merkleAirdrop.getUserRewardStatus(0, testAddress);
  console.log(`\n👤 用户状态:`);
  console.log(`   总奖励: ${ethers.formatEther(userStatus.totalReward)} CSWAP`);
  console.log(`   已领取: ${ethers.formatEther(userStatus.claimedReward)} CSWAP`);
  console.log(`   待领取: ${ethers.formatEther(userStatus.pendingReward)} CSWAP`);
  console.log(`   有记录: ${userStatus.hasRecord}`);
  
  // 检查是否已领取
  const isClaimed = await merkleAirdrop.isClaimed(0, testAddress);
  console.log(`   已领取: ${isClaimed}`);
  
  if (isClaimed) {
    console.log("✅ 该用户已领取过奖励");
    return;
  }
  
  // 模拟用户领取（需要用户私钥）
  console.log("\n⚠️  要完成实际领取，需要:");
  console.log("1. 将测试账户的私钥导入到钱包");
  console.log("2. 调用 merkleAirdrop.claimReward() 函数");
  console.log("3. 传入正确的参数和默克尔证明");
  
  console.log("\n📝 领取参数:");
  console.log(`   airdropId: 0`);
  console.log(`   amount: ${testAccount.amount} (${ethers.formatEther(testAmount)} CSWAP)`);
  console.log(`   totalReward: ${testAccount.amount} (${ethers.formatEther(testAmount)} CSWAP)`);
  console.log(`   proof: [${proof.map(p => `"${p}"`).join(", ")}]`);
}

// 执行测试
testAirdropClaim()
  .then(() => {
    console.log("\n🎉 测试完成！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 测试失败:", error.message);
    process.exit(1);
  });