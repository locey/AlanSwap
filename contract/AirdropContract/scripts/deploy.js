const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const prompt = require("prompt-sync")({ sigint: true });

// 部署记录保存路径
const DEPLOYMENTS_DIR = path.join(__dirname, "../deployments");
const DEPLOYMENT_FILE = path.join(DEPLOYMENTS_DIR, `${network.name}.json`);

// 确保部署目录存在
if (!fs.existsSync(DEPLOYMENTS_DIR)) {
  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
}

/**
 * 生成默克尔树并验证根哈希
 * @param {string} merkleFile - 默克尔证明文件路径（JSON格式）
 * @returns {Object} 包含默克尔树、根哈希和验证结果的对象
 */
async function generateAndVerifyMerkleTree(merkleFile) {
  console.log("\n📦 开始处理默克尔证明文件...");
  
  // 检查文件是否存在
  if (!fs.existsSync(merkleFile)) {
    throw new Error(`默克尔证明文件不存在: ${merkleFile}\n请在项目根目录创建该文件`);
  }

  // 读取白名单数据
  const whitelistData = JSON.parse(fs.readFileSync(merkleFile, "utf8"));
  
  // 验证数据格式
  if (!Array.isArray(whitelistData) || whitelistData.length === 0) {
    throw new Error("默克尔证明文件格式错误，应包含非空数组");
  }
  
  // 生成叶子节点 (address + amount)
  const leaves = whitelistData.map(item => {
    if (!item.address || !item.amount) {
      throw new Error(`白名单数据格式错误: ${JSON.stringify(item)}，需包含address和amount`);
    }
    // 确保地址小写并验证格式
    const address = ethers.getAddress(item.address);
    // 转换金额为wei（假设输入为ether单位，如"1.5"表示1.5个代币）
    const amount = ethers.parseEther(item.amount.toString());
    // 按合约逻辑生成叶子节点哈希
    return ethers.solidityPackedKeccak256(["address", "uint256"], [address, amount]);
  });

  // 构建默克尔树
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const rootHash = `0x${merkleTree.getRoot().toString("hex")}`;

  // 随机验证3条记录（确保默克尔树正确）
  const verifyCount = Math.min(3, whitelistData.length);
  console.log(`\n🔍 随机验证 ${verifyCount} 条白名单记录...`);
  
  for (let i = 0; i < verifyCount; i++) {
    const randomIndex = Math.floor(Math.random() * whitelistData.length);
    const item = whitelistData[randomIndex];
    const address = ethers.getAddress(item.address);
    const amount = ethers.parseEther(item.amount.toString());
    
    // 生成叶子节点（与构建树时使用相同的方法）
    const leaf = ethers.solidityPackedKeccak256(["address", "uint256"], [address, amount]);
    const proof = merkleTree.getProof(leaf).map(p => `0x${p.data.toString("hex")}`);
    
    // 使用merkletreejs的验证方法
    const isVerified = merkleTree.verify(proof, leaf, rootHash);
    
    if (!isVerified) {
      throw new Error(`白名单记录验证失败: ${JSON.stringify(item)}`);
    }
    console.log(`✅ 验证通过: ${address} 可领取 ${item.amount} CSWAP`);
  }

  console.log(`\n🌳 默克尔树生成成功，根哈希: ${rootHash.slice(0, 10)}...`);
  return { merkleTree, rootHash, whitelistData };
}

/**
 * 部署非升级合约
 * @param {string} contractName - 合约名称
 * @param  {...any} args - 构造函数参数
 * @returns {Object} 部署的合约实例
 */
async function deployNonUpgradable(contractName, ...args) {
  console.log(`\n🚀 部署非升级合约: ${contractName}`);
  const Factory = await ethers.getContractFactory(contractName);
  const contract = await Factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`✅ ${contractName} 部署完成，地址: ${address.slice(0, 10)}...`);
  return { contract, address };
}

/**
 * 部署可升级合约（代理模式）
 * @param {string} contractName - 合约名称
 * @param  {...any} args - 初始化函数参数
 * @returns {Object} 包含代理合约、实现合约和地址的对象
 */
async function deployUpgradable(contractName, ...args) {
  console.log(`\n🚀 部署可升级合约: ${contractName}（代理模式）`);
  const Factory = await ethers.getContractFactory(contractName);
  
  // 部署代理合约（UUPS模式）
  const proxy = await upgrades.deployProxy(Factory, args, {
    initializer: "initialize", // 初始化函数名称
    kind: "uups" 
  });
  
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  
  // 获取实现合约地址
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  
  console.log(`✅ ${contractName} 代理部署完成`);
  console.log(`   代理地址（用户交互）: ${proxyAddress.slice(0, 10)}...`);
  console.log(`   实现地址（逻辑合约）: ${implAddress.slice(0, 10)}...`);
  
  return { proxy, impl: { address: implAddress }, address: proxyAddress };
}

/**
 * 保存部署记录到文件
 * @param {Object} data - 部署数据
 */
async function saveDeployment(data) {
  const deploymentData = {
    timestamp: new Date().toISOString(),
    network: network.name,
    deployer: (await ethers.getSigners())[0].address,
    ...data
  };
  
  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(deploymentData, null, 2));
  console.log(`\n📝 部署记录已保存至: ${DEPLOYMENT_FILE}`);
}

/**
 * 主部署函数
 */
async function main() {
  // 1. 检查部署者余额
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`\n👤 部署者地址: ${deployer.address.slice(0, 10)}...`);
  console.log(`💰 部署者余额: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error("部署者余额不足，请确保有至少0.1 ETH用于支付gas");
  }

  // 2. 处理默克尔证明文件
  const merkleFile = path.join(__dirname, "../whitelist.json"); // 默克尔白名单文件路径
  const { rootHash } = await generateAndVerifyMerkleTree(merkleFile);

  // 3. 确认部署
  const confirm = prompt("\n⚠️ 即将开始部署合约到 " + network.name + " 测试网，是否继续? (y/n) ");
  if (confirm.toLowerCase() !== "y") {
    console.log("❌ 部署已取消");
    return;
  }

  // 4. 部署合约
  // 4.1 部署CSWAPToken（非升级合约）
  const totalSupply = ethers.parseEther("100000000"); // 1亿枚代币
  const { contract: cswapToken, address: cswapTokenAddress } = await deployNonUpgradable(
    "CSWAPToken",
    totalSupply
  );

  // 4.2 部署AirdropRewardPool（可升级合约）
  const { proxy: rewardPool, address: rewardPoolAddress, impl: rewardPoolImpl } = await deployUpgradable(
    "AirdropRewardPool",
    cswapTokenAddress // 初始化参数：代币地址
  );

  // 4.3 部署MerkleAirdrop（可升级合约）
  const { proxy: merkleAirdrop, address: merkleAirdropAddress, impl: merkleAirdropImpl } = await deployUpgradable(
    "MerkleAirdrop",
    rewardPoolAddress // 初始化参数：奖励池地址
  );

  // 5. 初始化合约关系
  console.log("\n🔗 初始化合约关系...");
  
  // 5.1 向奖励池转入初始代币
  const initialPoolAmount = ethers.parseEther("1000000"); // 转入100万枚代币到奖励池
  const transferTx = await cswapToken.transfer(rewardPoolAddress, initialPoolAmount);
  await transferTx.wait();
  console.log(`✅ 已向奖励池转入 ${ethers.formatEther(initialPoolAmount)} CSWAP`);
  
  // 5.2 授权空投合约从奖励池提取代币
  const authorizeTx = await rewardPool.authorizeAirdrop(merkleAirdropAddress);
  await authorizeTx.wait();
  console.log(`✅ 已授权空投合约从奖励池提取代币`);

  // 6. 创建空投活动
  console.log("\n🎯 创建空投活动...");
  const airdropName = "CSWAP Genesis Airdrop";
  const startTime = Math.floor(Date.now() / 1000); // 立即开始
  const endTime = startTime + 30 * 24 * 3600; // 持续30天
  const totalReward = ethers.parseEther("10000"); // 总奖励1万枚代币
  const treeVersion = 1;
  
  const createAirdropTx = await merkleAirdrop.createAirdrop(
    airdropName,
    rootHash,
    totalReward,
    startTime,
    endTime,
    treeVersion
  );
  await createAirdropTx.wait();
  console.log(`✅ 空投活动创建成功: ${airdropName}`);
  
  // 7. 激活空投活动
  const activateTx = await merkleAirdrop.activateAirdrop(0); // 第一个空投活动ID为0
  await activateTx.wait();
  console.log(`✅ 空投活动已激活`);

  // 8. 保存部署记录
  saveDeployment({
    CSWAPToken: {
      address: cswapTokenAddress,
      totalSupply: totalSupply.toString()
    },
    AirdropRewardPool: {
      proxyAddress: rewardPoolAddress,
      implAddress: rewardPoolImpl.address
    },
    MerkleAirdrop: {
      proxyAddress: merkleAirdropAddress,
      implAddress: merkleAirdropImpl.address,
      airdropName,
      merkleRoot: rootHash,
      startTime,
      endTime,
      totalReward: totalReward.toString()
    }
  });

  console.log("\n🎉 所有合约部署完成！");
  console.log(`📌 空投默克尔根哈希: ${rootHash}`);
  console.log(`💡 可在部署记录文件中查看完整合约地址`);
}

// 执行主函数并处理错误
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 部署失败:", error.message);
    process.exit(1);
  });
