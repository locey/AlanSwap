const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function getContractAddresses() {
  console.log("🔍 获取已部署的合约地址...");
  
  // 从 OpenZeppelin 部署记录中读取代理地址
  const openzeppelinFile = path.join(__dirname, "../.openzeppelin", `${network.name}.json`);
  
  if (!fs.existsSync(openzeppelinFile)) {
    console.log("❌ 未找到 OpenZeppelin 部署记录");
    return;
  }
  
  const openzeppelinData = JSON.parse(fs.readFileSync(openzeppelinFile, "utf8"));
  
  console.log("\n📋 已部署的合约地址：");
  console.log("=" * 50);
  
  // 显示代理合约地址
  if (openzeppelinData.proxies && openzeppelinData.proxies.length > 0) {
    console.log("\n🔗 代理合约地址：");
    openzeppelinData.proxies.forEach((proxy, index) => {
      console.log(`代理 ${index + 1}: ${proxy.address}`);
    });
  }
  
  // 显示实现合约地址
  if (openzeppelinData.impls) {
    console.log("\n⚙️ 实现合约地址：");
    Object.values(openzeppelinData.impls).forEach((impl, index) => {
      console.log(`实现 ${index + 1}: ${impl.address}`);
    });
  }
  
  console.log("\n💡 前端空投模块应该使用：");
  console.log("🎯 MerkleAirdrop 合约地址（用户交互）: " + openzeppelinData.proxies[1].address);
  console.log("🏦 AirdropRewardPool 合约地址（奖励池）: " + openzeppelinData.proxies[0].address);
  
  // 尝试获取 CSWAPToken 地址（需要从部署日志或其他方式获取）
  console.log("\n⚠️  CSWAPToken 地址需要从部署日志中获取");
}

getContractAddresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 获取地址失败:", error.message);
    process.exit(1);
  });
