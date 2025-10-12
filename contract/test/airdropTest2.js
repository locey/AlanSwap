// const { expect } = require("chai");
// const { ethers, upgrades } = require("hardhat");
// const { MerkleTree } = require("merkletreejs");
// const keccak256 = require("keccak256");

// // 辅助函数：格式化地址输出
// const formatAddressLog = (name, address) => {
//   console.log(`🔹 ${name.padEnd(20)}: ${address}`);
// };

// // 全局变量存储测试环境
// let testEnv = {};

// // 初始化测试环境的函数（替代beforeEach）
// const initializeTestEnv = async () => {
//   console.log("\n==============================================");
//   console.log("📦 开始部署测试合约...");
//   console.log("==============================================\n");

//   // 获取测试账户
//   const [owner, user1, user2, user3] = await ethers.getSigners();
//   console.log("👤 测试账户:");
//   console.log(`   部署者: ${owner.address}`);
//   console.log(`   用户1: ${user1.address}`);
//   console.log(`   用户2: ${user2.address}`);
//   console.log(`   用户3: ${user3.address}\n`);

//   // 初始化测试账户数据
//   const testAccounts = [
//     { address: user1.address, amount: ethers.parseEther("100") },
//     { address: user2.address, amount: ethers.parseEther("200") },
//     { address: user3.address, amount: ethers.parseEther("300") }
//   ];

//   // 测试常量
//   const INITIAL_TOKEN_SUPPLY = ethers.parseEther("1000000");
//   const AIRDROP_TOTAL_REWARD = ethers.parseEther("600"); // 100+200+300
//   const TREE_VERSION = 1;

//   // 1. 部署CSWAP代币
//   console.log("🚀 部署CSWAP代币...");
//   const CSWAPToken = await ethers.getContractFactory("CSWAPToken");
//   const cswapToken = await CSWAPToken.deploy(INITIAL_TOKEN_SUPPLY);
//   await cswapToken.waitForDeployment();
//   const cswapAddress = await cswapToken.getAddress();
//   formatAddressLog("CSWAPToken", cswapAddress);
//   console.log(`   初始供应量: ${ethers.formatEther(INITIAL_TOKEN_SUPPLY)} CSWAP\n`);

//   // 2. 部署奖励池
//   console.log("🚀 部署奖励池合约...");
//   const AirdropRewardPool = await ethers.getContractFactory("AirdropRewardPool");
//   const rewardPool = await upgrades.deployProxy(
//     AirdropRewardPool,
//     [cswapAddress],
//     { kind: "uups" }
//   );
//   await rewardPool.waitForDeployment();
//   const rewardPoolAddress = await rewardPool.getAddress();
//   formatAddressLog("奖励池代理", rewardPoolAddress);
//   console.log(`   关联代币: ${await rewardPool.rewardToken()}\n`);

//   // 3. 部署空投合约
//   console.log("🚀 部署空投合约...");
//   const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdropWithRewardRecord");
//   const merkleAirdrop = await upgrades.deployProxy(
//     MerkleAirdrop,
//     [rewardPoolAddress, cswapAddress],
//     { kind: "uups" }
//   );
//   await merkleAirdrop.waitForDeployment();
//   const airdropAddress = await merkleAirdrop.getAddress();
//   formatAddressLog("空投代理", airdropAddress);

//   // 授权空投合约调用奖励池
//   console.log("🔑 授权空投代理合约...");
//   await rewardPool.authorizeAirdrop(airdropAddress);
//   const isAuthorized = await rewardPool.authorizedAirdrops(airdropAddress);
//   console.log(`   代理合约授权状态: ${isAuthorized}\n`);

//   // 4. 向奖励池转入初始资金
//   console.log("💸 向奖励池转入初始资金...");
//   await cswapToken.transfer(rewardPoolAddress, AIRDROP_TOTAL_REWARD);
//   const poolBalance = await rewardPool.getPoolBalance();
//   console.log(`   奖励池余额: ${ethers.formatEther(poolBalance)} CSWAP\n`);

//   // 5. 构建默克尔树
//   console.log("🌳 构建默克尔树...");
//   const leaves = testAccounts.map(account => 
//     ethers.solidityPackedKeccak256(
//       ["address", "uint256"],
//       [account.address, account.amount]
//     )
//   );
//   const merkleTree = new MerkleTree(
//     leaves.map(leaf => Buffer.from(leaf.slice(2), "hex")),
//     keccak256,
//     { sortPairs: true }
//   );
//   const rootHash = `0x${merkleTree.getRoot().toString("hex")}`;
//   console.log(`   默克尔树根哈希: ${rootHash}\n`);

//   // 6. 设置时间参数
//   const latestBlock = await ethers.provider.getBlock("latest");
//   const START_TIME = latestBlock.timestamp + 10;
//   const END_TIME = START_TIME + 86400;
//   console.log(`   空投时间: ${new Date(START_TIME * 1000).toLocaleString()} ~ ${new Date(END_TIME * 1000).toLocaleString()}`);
//   console.log("\n==============================================");
//   console.log("✅ 测试环境准备完成");
//   console.log("==============================================\n");

//   // 返回初始化完成的测试环境
//   return {
//     owner,
//     user1,
//     user2,
//     user3,
//     cswapToken,
//     rewardPool,
//     merkleAirdrop,
//     testAccounts,
//     merkleTree,
//     rootHash,
//     constants: {
//       INITIAL_TOKEN_SUPPLY,
//       AIRDROP_TOTAL_REWARD,
//       TREE_VERSION,
//       START_TIME,
//       END_TIME
//     }
//   };
// };

// // 创建并激活空投的辅助函数
// const createAndActivateAirdrop = async (env, airdropId = 0) => {
//   console.log("\n📌 准备工作：创建并激活空投");
  
//   // 创建空投
//   await env.merkleAirdrop.createAirdrop(
//     `测试空投-${airdropId}`,
//     env.rootHash,
//     env.constants.AIRDROP_TOTAL_REWARD,
//     env.constants.START_TIME,
//     env.constants.END_TIME,
//     env.constants.TREE_VERSION
//   );
//   console.log(`   ✅ 空投创建完成（ID: ${airdropId}，版本号: ${env.constants.TREE_VERSION}`);

//   // 调整时间到开始时间
//   await ethers.provider.send("evm_setNextBlockTimestamp", [env.constants.START_TIME]);
//   await ethers.provider.send("evm_mine");
//   console.log(`   ⏰ 已调整区块时间到空投开始时间`);

//   // 激活空投
//   await env.merkleAirdrop.activateAirdrop(airdropId);
//   const isActive = await env.merkleAirdrop.getAirdropInfo(airdropId).then(info => info.isActive);
//   console.log(`   ✅ 空投激活状态: ${isActive ? "已激活" : "未激活"}`);
  
//   return airdropId;
// };

// describe("MerkleAirdrop + RewardPool 完整测试（无beforeEach版）", function () {
//   // 在所有测试开始前初始化一次环境
//   before(async function () {
//     testEnv = await initializeTestEnv();
//   });

//   describe("基本功能测试", function () {
//     it("应该正确初始化合约关联关系", async function () {
//       console.log("\n📝 测试: 验证合约关联关系");
//       const { cswapToken, rewardPool, merkleAirdrop } = testEnv;

//       expect(await rewardPool.rewardToken()).to.equal(await cswapToken.getAddress());
//       console.log("   ✅ 奖励池关联代币正确");

//       expect(await merkleAirdrop.rewardPool()).to.equal(await rewardPool.getAddress());
//       console.log("   ✅ 空投合约关联奖励池正确");

//       expect(await merkleAirdrop.rewardToken()).to.equal(await cswapToken.getAddress());
//       console.log("   ✅ 空投合约关联奖励代币正确");

//       expect(await rewardPool.authorizedAirdrops(await merkleAirdrop.getAddress())).to.be.true;
//       console.log("   ✅ 空投合约已获得奖励池授权");
//     });

//     it("应该成功创建空投活动（含树版本号）", async function () {
//       console.log("\n📝 测试: 创建空投活动（带树版本号）");
//       const { merkleAirdrop, rootHash, constants } = testEnv;

//       await expect(merkleAirdrop.createAirdrop(
//         "测试空投",
//         rootHash,
//         constants.AIRDROP_TOTAL_REWARD,
//         constants.START_TIME,
//         constants.END_TIME,
//         constants.TREE_VERSION
//       ))
//         .to.emit(merkleAirdrop, "AirdropCreated")
//         .withArgs(0, "测试空投", rootHash, constants.AIRDROP_TOTAL_REWARD, constants.TREE_VERSION);

//       const info = await merkleAirdrop.getAirdropInfo(0);
//       expect(info.name).to.equal("测试空投");
//       expect(info.merkleRoot).to.equal(rootHash);
//       expect(info.totalReward).to.equal(constants.AIRDROP_TOTAL_REWARD);
//       expect(info.isActive).to.be.false;
//       expect(info.treeVersion).to.equal(constants.TREE_VERSION);

//       console.log("   ✅ 空投活动创建成功");
//       console.log(`   活动ID: 0，树版本号: ${info.treeVersion}`);
//     });

//     it("应该成功激活空投活动", async function () {
//       console.log("\n📝 测试: 激活空投活动");
//       const { merkleAirdrop, constants } = testEnv;

//       // 创建空投（ID: 1，避免与上一个测试冲突）
//       await merkleAirdrop.createAirdrop(
//         "测试空投-激活验证",
//         testEnv.rootHash,
//         constants.AIRDROP_TOTAL_REWARD,
//         constants.START_TIME,
//         constants.END_TIME,
//         constants.TREE_VERSION
//       );

//       // 调整时间到活动开始后
//       await ethers.provider.send("evm_setNextBlockTimestamp", [constants.START_TIME]);
//       await ethers.provider.send("evm_mine");
//       console.log("   ⏱️ 已调整时间至活动开始时间");

//       await expect(merkleAirdrop.activateAirdrop(1))
//         .to.emit(merkleAirdrop, "AirdropActivated")
//         .withArgs(1);

//       const info = await merkleAirdrop.getAirdropInfo(1);
//       expect(info.isActive).to.be.true;
//       console.log("   ✅ 空投活动激活成功");
//     });
//   });

//   describe("奖励领取及记录测试", function () {
//     let airdropId;
    
//     // 只在这个测试组开始前创建一次空投
//     before(async function () {
//       airdropId = await createAndActivateAirdrop(testEnv, 2);
//     });

//     it("用户首次领取应正确初始化奖励记录", async function () {
//       console.log("\n📝 测试用例1：用户1首次领取及奖励记录初始化");
//       const { testAccounts, merkleAirdrop, merkleTree, constants, user1 } = testEnv;
//       const [user1Data] = testAccounts;
//       const userAddr = user1Data.address;
//       const totalReward = user1Data.amount;
//       const claimAmt = totalReward;
//       const userSigner = user1;

//       // 生成默克尔证明
//       const userLeaf = await merkleAirdrop.calculateLeafHash(userAddr, totalReward);
//       console.log(`   🧑 用户信息：地址=${userAddr}，总奖励=${ethers.formatEther(totalReward)} CSWAP`);

//       const leafBuffer = Buffer.from(userLeaf.slice(2), "hex");
//       const proof = merkleTree.getProof(leafBuffer);
//       const proofHex = proof.map(node => `0x${node.data.toString("hex")}`);

//       // 调整时间
//       const targetTime = constants.START_TIME + 5;
//       await ethers.provider.send("evm_setNextBlockTimestamp", [targetTime]);
//       await ethers.provider.send("evm_mine");

//       // 领取前验证
//       const [initialTotal, initialClaimed, initialPending, hasRecord] = 
//         await merkleAirdrop.getUserRewardStatus(airdropId, userAddr);
//       expect(hasRecord).to.be.false;

//       // 执行领取
//       await expect(merkleAirdrop.connect(userSigner).claimReward(
//         airdropId,
//         claimAmt,
//         totalReward,
//         proofHex
//       ))
//         .to.emit(merkleAirdrop, "RewardClaimed")
//         .withArgs(
//           airdropId, 
//           userAddr, 
//           claimAmt, 
//           totalReward,
//           claimAmt,
//           0,
//           targetTime
//         );

//       // 验证奖励记录
//       const [userTotal, userClaimed, userPending, userHasRecord] = 
//         await merkleAirdrop.getUserRewardStatus(airdropId, userAddr);
      
//       expect(userHasRecord).to.be.true;
//       expect(userTotal).to.equal(totalReward);
//       expect(userClaimed).to.equal(claimAmt);
//       expect(userPending).to.equal(0);
      
//       console.log(`   ✅ 奖励记录验证通过`);
//     });

//     it("用户多次领取应正确更新奖励记录", async function () {
//       console.log("\n📝 测试用例2：用户2多次领取及记录更新");
//       const { testAccounts, merkleAirdrop, merkleTree, constants, user2 } = testEnv;
//       const [, user2Data] = testAccounts;
//       const userAddr = user2Data.address;
//       const totalReward = user2Data.amount;
//       const firstClaim = ethers.parseEther("100");
//       const secondClaim = ethers.parseEther("100");
//       const userSigner = user2;

//       // 生成默克尔证明
//       const userLeaf = await merkleAirdrop.calculateLeafHash(userAddr, totalReward);
//       const leafBuffer = Buffer.from(userLeaf.slice(2), "hex");
//       const proofHex = merkleTree.getProof(leafBuffer).map(node => `0x${node.data.toString("hex")}`);

//       // 首次领取
//       await ethers.provider.send("evm_setNextBlockTimestamp", [constants.START_TIME + 5]);
//       await ethers.provider.send("evm_mine");
//       await merkleAirdrop.connect(userSigner).claimReward(airdropId, firstClaim, totalReward, proofHex);
//       console.log(`   ✅ 首次领取 ${ethers.formatEther(firstClaim)} CSWAP`);

//       // 验证首次领取后记录
//       let [total, claimed, pending] = await merkleAirdrop.getUserRewardStatus(airdropId, userAddr);
//       expect(claimed).to.equal(firstClaim);
//       expect(pending).to.equal(totalReward - firstClaim);

//       // 第二次领取
//       await ethers.provider.send("evm_setNextBlockTimestamp", [constants.START_TIME + 10]);
//       await ethers.provider.send("evm_mine");
//       await merkleAirdrop.connect(userSigner).claimReward(airdropId, secondClaim, totalReward, []);
//       console.log(`   ✅ 第二次领取 ${ethers.formatEther(secondClaim)} CSWAP`);

//       // 验证第二次领取后记录
//       [total, claimed, pending] = await merkleAirdrop.getUserRewardStatus(airdropId, userAddr);
//       expect(claimed).to.equal(firstClaim + secondClaim);
//       expect(pending).to.equal(totalReward - claimed);
//     });

//     it("领取金额超过待领取奖励应失败", async function () {
//       console.log("\n📝 测试用例3：领取金额超过待领取奖励");
//       const { testAccounts, merkleAirdrop, merkleTree, constants, user3 } = testEnv;
//       const [, , user3Data] = testAccounts;
//       const userAddr = user3Data.address;
//       const totalReward = user3Data.amount;
//       const firstClaim = ethers.parseEther("200");
//       const invalidClaim = ethers.parseEther("200");
//       const userSigner = user3;

//       // 生成证明并首次领取
//       const userLeaf = await merkleAirdrop.calculateLeafHash(userAddr, totalReward);
//       const proofHex = merkleTree.getProof(Buffer.from(userLeaf.slice(2), "hex")).map(node => `0x${node.data.toString("hex")}`);
      
//       await ethers.provider.send("evm_setNextBlockTimestamp", [constants.START_TIME + 5]);
//       await ethers.provider.send("evm_mine");
//       await merkleAirdrop.connect(userSigner).claimReward(airdropId, firstClaim, totalReward, proofHex);
//       console.log(`   ✅ 首次领取 ${ethers.formatEther(firstClaim)} CSWAP`);

//       // 尝试超额领取
//       await expect(
//         merkleAirdrop.connect(userSigner).claimReward(airdropId, invalidClaim, totalReward, [])
//       ).to.be.revertedWith("MerkleAirdrop: claim amount exceed pending reward");
//     });
//   });

//   describe("异常场景测试", function () {
//     let airdropId;
    
//     // 只在这个测试组开始前创建一次空投
//     before(async function () {
//       airdropId = await createAndActivateAirdrop(testEnv, 3);
//     });

//     it("使用错误的总奖励金额领取应失败", async function () {
//       console.log("\n📝 异常测试：错误的总奖励金额");
//       const { testAccounts, merkleAirdrop, merkleTree, user1 } = testEnv;
//       const [user1Data] = testAccounts;
//       const userAddr = user1Data.address;
//       const realTotal = user1Data.amount;
//       const fakeTotal = ethers.parseEther("50");
//       const userSigner = user1;

//       // 生成基于真实总奖励的证明
//       const userLeaf = await merkleAirdrop.calculateLeafHash(userAddr, realTotal);
//       const proofHex = merkleTree.getProof(Buffer.from(userLeaf.slice(2), "hex")).map(node => `0x${node.data.toString("hex")}`);

//       // 尝试用错误的总奖励领取
//       await expect(
//         merkleAirdrop.connect(userSigner).claimReward(airdropId, fakeTotal, fakeTotal, proofHex)
//       ).to.be.revertedWith("MerkleAirdrop: invalid merkle proof");
//     });

//     it("非白名单用户领取应失败", async function () {
//       console.log("\n📝 异常测试：非白名单用户领取");
//       const { merkleAirdrop, constants } = testEnv;
//       const nonWhitelistAddr = "0x1234567890123456789012345678901234567890";
//       const fakeTotal = ethers.parseEther("100");
      
//       // 生成虚假证明
//       const fakeLeaf = ethers.solidityPackedKeccak256(["address", "uint256"], [nonWhitelistAddr, fakeTotal]);
//       const fakeProof = merkleTree.getProof(Buffer.from(fakeLeaf.slice(2), "hex"));
//       const fakeProofHex = fakeProof.map(node => node ? `0x${node.data.toString("hex")}` : "0x");

//       // 调整时间
//       await ethers.provider.send("evm_setNextBlockTimestamp", [constants.START_TIME + 5]);
//       await ethers.provider.send("evm_mine");

//       // 尝试领取
//       await expect(
//         merkleAirdrop.claimReward(airdropId, fakeTotal, fakeTotal, fakeProofHex)
//       ).to.be.revertedWith("MerkleAirdrop: invalid merkle proof");
//     });
//   });
// });
