const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const { keccak256 } = require("ethers");



// 辅助函数：格式化地址输出
const formatAddressLog = (name, address) => {
  console.log(`🔹 ${name.padEnd(20)}: ${address}`);
};

describe("MerkleAirdrop + RewardPool 完整测试", function () {
  let cswapToken;
  let rewardPool;
  let merkleAirdrop;
  let owner, user1, user2, user3;
  let rewardPoolImplementation, airdropImplementation;
  let rewardPoolProxy, airdropProxy;

  // 测试常量（Ethers v6：使用 ethers.parseEther 替代 ethers.utils.parseEther）
  const INITIAL_TOKEN_SUPPLY = ethers.parseEther("1000000"); // 100万枚
  const AIRDROP_TOTAL_REWARD = ethers.parseEther("1000"); // 空投总奖励
  const START_TIME = Math.floor(Date.now() / 1000) + 60; // 1分钟后开始
  const END_TIME = START_TIME + 86400; // 24小时后结束

  // 构建默克尔树的测试数据
  let testAccounts = [];
  let merkleTree;
  let rootHash;

  beforeEach(async function () {
    console.log("\n==============================================");
    console.log("📦 开始部署测试合约...");
    console.log("==============================================\n");

    // 获取测试账户（Ethers v6 中 getSigners() 用法不变）
    [owner, user1, user2, user3] = await ethers.getSigners();
    console.log("👤 测试账户:");
    console.log(`   部署者: ${owner.address}`);
    console.log(`   用户1: ${user1.address}`);
    console.log(`   用户2: ${user2.address}`);
    console.log(`   用户3: ${user3.address}\n`);

    testAccounts = [
      { address: user1.address, amount: ethers.parseEther("100") },
      { address: user2.address, amount: ethers.parseEther("200") },
      { address: user3.address, amount: ethers.parseEther("300") }
    ];

    // 验证 testAccounts 有效性
    for (let i = 0; i < testAccounts.length; i++) {
      const acc = testAccounts[i];
      if (!ethers.isAddress(acc.address)) {
        throw new Error(`❌ testAccounts[${i}] 地址无效: ${acc.address}`);
      }
      if (acc.amount === undefined || acc.amount === 0 || acc.amount > ethers.parseEther("10000")) {
        throw new Error(`❌ testAccounts[${i}] 金额无效: ${acc.amount}`);
      }
    }
    console.log(`✅ 验证通过，共 ${testAccounts.length} 个有效账户`);

    // 1. 部署CSWAP代币（带地址验证）
    console.log("🚀 部署CSWAP代币...");
    const CSWAPToken = await ethers.getContractFactory("CSWAPToken");
    cswapToken = await CSWAPToken.deploy(INITIAL_TOKEN_SUPPLY);
    await cswapToken.waitForDeployment(); // 等待部署完成
    const cswapAddress = await cswapToken.getAddress();

    // 验证地址有效性
    if (!cswapAddress || cswapAddress === ethers.ZeroAddress) {
      throw new Error("❌ CSWAP代币部署失败：未获取到有效地址");
    }
    formatAddressLog("CSWAPToken", cswapAddress);
    console.log(`   初始供应量: ${ethers.formatEther(INITIAL_TOKEN_SUPPLY)} CSWAP\n`);

    // 2. 部署奖励池（带参数验证）
    console.log("🚀 部署奖励池合约...");
    const AirdropRewardPool = await ethers.getContractFactory("AirdropRewardPool");

    // 验证初始化参数
    if (!cswapAddress) {
      throw new Error("❌ 奖励池初始化失败：CSWAP地址为空");
    }

    rewardPool = await upgrades.deployProxy(
      AirdropRewardPool,
      [cswapAddress], // 传入验证后的地址
      { kind: "uups" }
    );
    await rewardPool.waitForDeployment(); // 等待部署完成
    const rewardPoolAddress = await rewardPool.getAddress();

    if (!rewardPoolAddress || rewardPoolAddress === ethers.ZeroAddress) {
      throw new Error("❌ 奖励池部署失败：未获取到有效地址");
    }
    formatAddressLog("奖励池代理", rewardPoolAddress);
    console.log(`   关联代币: ${await rewardPool.rewardToken()}\n`);

    console.log("🚀 部署空投合约实现...");
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const merkleAirdropImplementation = await MerkleAirdrop.deploy();
    await merkleAirdropImplementation.waitForDeployment();
    const merkleAirdropImplAddress = await merkleAirdropImplementation.getAddress();
    console.log(`   空投实现合约地址: ${merkleAirdropImplAddress}`);


    // 先部署代理合约（此时未授权）
    console.log("🚀 部署空投代理合约...");
    merkleAirdrop = await upgrades.deployProxy(
      MerkleAirdrop,
      [rewardPoolAddress], // 传入奖励池地址
      {
        kind: "uups",
        implementation: merkleAirdropImplementation
      }
    );
    await merkleAirdrop.waitForDeployment();
    const airdropAddress = await merkleAirdrop.getAddress();
    formatAddressLog("空投代理", airdropAddress);

    // 关键：代理合约部署后，授权代理地址
    console.log("🔑 授权空投代理合约...");
    await rewardPool.authorizeAirdrop(airdropAddress);

    // 验证授权是否成功
    const isAuthorized = await rewardPool.authorizedAirdrops(airdropAddress);
    if (!isAuthorized) {
      throw new Error("❌ 空投代理合约授权失败");
    }
    console.log(`   代理合约授权状态: ${isAuthorized}\n`);


    // 4. 转入奖励资金（带验证）
    console.log("💸 向奖励池转入初始资金...");
    const transferTx = await cswapToken.transfer(rewardPoolAddress, AIRDROP_TOTAL_REWARD);
    await transferTx.wait(); // 等待转账完成

    const poolBalance = await rewardPool.getPoolBalance();
    if (poolBalance !== AIRDROP_TOTAL_REWARD) {
      throw new Error(`❌ 奖励池资金转入失败：实际余额 ${ethers.formatEther(poolBalance)}`);
    }
    console.log(`   转入金额: ${ethers.formatEther(AIRDROP_TOTAL_REWARD)} CSWAP`);
    console.log(`   奖励池余额: ${ethers.formatEther(poolBalance)} CSWAP\n`);

    // 5. 构建默克尔树（修正叶子节点格式）
    console.log("🌳 构建默克尔树...");
    // 存储有效叶子节点（避免 undefined）
    const validLeaves = [];
    for (const account of testAccounts) {
      try {
        // 1. 验证账户数据有效性（避免 undefined 地址/金额）
        if (!account.address || account.amount === undefined || account.amount === 0) {
          console.warn(`⚠️  跳过无效账户数据: ${JSON.stringify(account)}`);
          continue;
        }

        // 2. 计算叶子节点哈希（统一转为 Buffer 类型，适配 merkletreejs）
        // 方式：先通过 ethers 计算 keccak256 哈希，再转为 Buffer
        const encoded = ethers.solidityPackedKeccak256(
          ["address", "uint256"],
          [account.address.toLowerCase(), account.amount] // 地址转小写，避免大小写问题
        );
        // 将 0x 前缀的字符串转为 Buffer（关键：merkletreejs 优先处理 Buffer）
        const leafBuffer = Buffer.from(encoded.slice(2), "hex");
        validLeaves.push(leafBuffer);

        console.log(`   叶子节点[${account.address}]: 0x${leafBuffer.toString("hex")}`);
      } catch (e) {
        console.error(`⚠️  生成叶子节点失败: ${e.message}，账户数据: ${JSON.stringify(account)}`);
      }
    }

    // 3. 验证有效叶子节点数量（至少 1 个，否则树无法构建）
    if (validLeaves.length === 0) {
      throw new Error("❌ 无有效叶子节点，无法构建默克尔树");
    }

    // 4. 构建默克尔树（使用 keccak256 哈希函数，显式开启排序）
    // merkleTree = new MerkleTree(validLeaves, (data) => {
    //   // data 是 Buffer 类型，需转为 0x 前缀字符串后计算哈希
    //   const hexStr = `0x${data.toString("hex")}`;
    //   return keccak256(hexStr); // ethers.keccak256 会返回 0x 前缀字符串
    // }, {
    //   sort: true,
    //   sortLeaves: true
    // });

    merkleTree = new MerkleTree(validLeaves, keccak256, {
      sort: true,
      sortLeaves: true,
      sortPairs: true
    });

    // 5. 生成根哈希（转为 0x 前缀字符串，适配合约 bytes32 类型）
    const rootBuffer = merkleTree.getRoot();
    rootHash = `0x${rootBuffer.toString("hex")}`;
    console.log(`   默克尔树根哈希: ${rootHash}`);
    console.log(`   根哈希格式验证: ${rootHash.match(/^0x[0-9a-fA-F]{64}$/) ? "✅ 有效 bytes32" : "❌ 无效"}`);

    console.log("\n==============================================");
    console.log("✅ 测试环境准备完成");
    console.log("==============================================\n");


    // 关键：在 beforeEach 中获取并定义 blockTimestamp，供所有测试用例使用
    const latestBlock = await ethers.provider.getBlock("latest");
    this.blockTimestamp = latestBlock.timestamp; // 用 this 挂载，全局可访问
    console.log(`   当前区块时间: ${new Date(this.blockTimestamp * 1000).toLocaleString()}\n`);


  });

  describe("基本功能测试", function () {
    it("应该正确初始化合约关联关系", async function () {
      console.log("\n📝 测试: 验证合约关联关系");

      // 验证奖励池关联的代币
      expect(await rewardPool.rewardToken()).to.equal(cswapToken.target);
      console.log("   ✅ 奖励池关联代币正确");

      // 验证空投合约关联的奖励池
      expect(await merkleAirdrop.rewardPool()).to.equal(rewardPool.target);
      console.log("   ✅ 空投合约关联奖励池正确");

      // 验证空投合约已被奖励池授权
      expect(await rewardPool.authorizedAirdrops(merkleAirdrop.target)).to.be.true;
      console.log("   ✅ 空投合约已获得奖励池授权");

      // 验证奖励池余额
      expect(await rewardPool.getPoolBalance()).to.equal(AIRDROP_TOTAL_REWARD);
      console.log("   ✅ 奖励池余额正确");
    });

    it("应该成功创建空投活动", async function () {
      console.log("\n📝 测试: 创建空投活动");

      // 创建前再次验证余额
      const poolBalance = await rewardPool.getPoolBalance();
      console.log(`   奖励池当前余额: ${ethers.formatEther(poolBalance)} CSWAP`);
      console.log(`   空投总奖励需求: ${ethers.formatEther(AIRDROP_TOTAL_REWARD)} CSWAP`);
      // 断言余额充足
      expect(poolBalance).to.be.gte(AIRDROP_TOTAL_REWARD, "奖励池余额不足");


      // 验证根哈希格式（确保是 0x 前缀的字符串）
      console.log(`   默克尔树根哈希格式: ${typeof rootHash} (长度: ${rootHash.length})`);
      // expect(rootHash).to.match(/^0x[0-9a-fA-F]{64}$/, "根哈希不是 valid bytes32 格式");

      await expect(merkleAirdrop.createAirdrop(
        "测试空投",
        rootHash,
        AIRDROP_TOTAL_REWARD,// 与转入金额一致
        START_TIME,
        END_TIME
      ))
        .to.emit(merkleAirdrop, "AirdropCreated")
        .withArgs(0, "测试空投", rootHash, AIRDROP_TOTAL_REWARD);

      // 验证活动信息
      const info = await merkleAirdrop.getAirdropInfo(0);
      expect(info.name).to.equal("测试空投");
      expect(info.merkleRoot).to.equal(rootHash);
      expect(info.totalReward).to.equal(AIRDROP_TOTAL_REWARD);
      expect(info.isActive).to.be.false;

      console.log("   ✅ 空投活动创建成功");
      console.log(`   活动ID: 0`);
      console.log(`   活动名称: ${info.name}`);
      console.log(`   总奖励: ${ethers.formatEther(info.totalReward)} CSWAP`);
    });

    it("应该成功激活空投活动", async function () {
      console.log("\n📝 测试: 激活空投活动");

      // 先创建活动
      await merkleAirdrop.createAirdrop(
        "测试空投",
        rootHash,
        AIRDROP_TOTAL_REWARD,
        START_TIME,
        END_TIME
      );

      // 快速调整时间到活动开始后（Ethers v6 中 provider 方法不变）
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine");
      console.log("   ⏱️ 已调整时间至活动开始后");

      // 激活活动
      await expect(merkleAirdrop.activateAirdrop(0))
        .to.emit(merkleAirdrop, "AirdropActivated")
        .withArgs(0);

      // 验证活动状态
      const info = await merkleAirdrop.getAirdropInfo(0);
      expect(info.isActive).to.be.true;
      console.log("   ✅ 空投活动激活成功");
    });
  });

  // 奖励领取测试模块（完整代码）
  describe("奖励领取测试", function () {
    // 内层 beforeEach：每个领取用例执行前，确保空投已创建+激活（避免重复代码）
    beforeEach(async function () {
      console.log("\n📌 领取用例前置准备：创建并激活空投");

      // 1. 获取当前区块时间，设置空投时间（开始时间=当前+10秒，结束时间=开始+1天）
      const latestBlock = await ethers.provider.getBlock("latest");
      const startTime = latestBlock.timestamp + 10;
      const endTime = startTime + 86400; // 1天有效期

      // 2. 调用合约创建空投（使用 beforeEach 中已构建的 rootHash）
      await merkleAirdrop.createAirdrop(
        "测试空投-领取验证",
        rootHash,
        AIRDROP_TOTAL_REWARD,
        startTime,
        endTime
      );
      console.log(`   ✅ 空投创建完成（ID: 0，开始时间: ${new Date(startTime * 1000).toLocaleString()}）`);

      // 3. 关键修正：先调整时间到 startTime，再激活空投
      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime]); // 调整时间到开始时间
      await ethers.provider.send("evm_mine"); // 生成新区块，使时间生效
      console.log(`   ⏰ 已调整区块时间到空投开始时间：${new Date(startTime * 1000).toLocaleString()}`);

      // 4. 激活空投（仅 owner 可操作）
      await merkleAirdrop.activateAirdrop(0);
      const isActive = await merkleAirdrop.getAirdropInfo(0).then(info => info.isActive);
      console.log(`   ✅ 空投激活状态: ${isActive ? "已激活" : "未激活"}`);

      // 5. 存储当前空投的时间信息（供后续用例使用）
      this.airdropStartTime = startTime;
      this.airdropEndTime = endTime;
    });

    // 用例1：用户在有效期内，使用正确证明成功领取奖励
    it("用户应该成功领取奖励（有效期内+正确证明）", async function () {
      console.log("\n📝 测试用例1：用户1成功领取奖励");
      const [user1Data] = testAccounts; // 取第一个测试账户（user1）
      const userAddr = user1Data.address;
      const claimAmt = user1Data.amount;
      const userSigner = await ethers.provider.getSigner(userAddr); // 获取用户1的签名器

      // 1. 关键：通过合约辅助函数生成用户1的 leaf（与合约验证逻辑完全一致）
      const userLeaf = await merkleAirdrop.calculateLeafHash(userAddr, claimAmt);
      console.log(`   🧑 用户信息：地址=${userAddr}，领取金额=${ethers.formatEther(claimAmt)} CSWAP`);
      console.log(`   🍃 合约生成的用户 leaf：${userLeaf}`);

      // 2. 生成默克尔证明（基于合约返回的 leaf）
      const leafBuffer = Buffer.from(userLeaf.slice(2), "hex"); // 转为 Buffer 适配 merkletreejs
      const proof = merkleTree.getProof(leafBuffer);
      const proofHex = proof.map(node => `0x${node.data.toString("hex")}`); // 转为合约需要的 bytes32[] 格式

      // 3. 验证证明有效性（长度≠0，避免空证明）
      if (proofHex.length === 0) {
        throw new Error("❌ 生成的默克尔证明为空，请检查 leaf 是否在默克尔树中");
      }
      console.log(`   📄 生成的默克尔证明：${JSON.stringify(proofHex)}（长度：${proofHex.length}）`);

      // 4. 调整区块时间到空投有效期内（避免“时间未到”错误）
      const targetTime = this.airdropStartTime + 5; // 开始时间后5秒（确保在有效期内）
      await ethers.provider.send("evm_setNextBlockTimestamp", [targetTime]);
      await ethers.provider.send("evm_mine"); // 生成新区块，使时间调整生效
      const adjustedBlock = await ethers.provider.getBlock("latest");
      console.log(`   ⏰ 调整后区块时间：${new Date(adjustedBlock.timestamp * 1000).toLocaleString()}`);
      console.log(`   ⏰ 空投有效期：${new Date(this.airdropStartTime * 1000).toLocaleString()} ~ ${new Date(this.airdropEndTime * 1000).toLocaleString()}`);


      // await ethers.provider.send("evm_setNextBlockTimestamp", [targetTime]); // 再次固定时间（防止自动递增）


      // 5. 记录领取前用户余额（验证后续余额增加）
      const beforeBal = await cswapToken.balanceOf(userAddr);
      console.log(`   💰 领取前用户余额：${ethers.formatEther(beforeBal)} CSWAP`);

      // 6. 调用领取函数 + 验证事件
      await expect(merkleAirdrop.connect(userSigner).claimReward(
      0,          // 空投ID（对应创建的第一个空投）
      claimAmt,   // 领取金额（必须与默克尔树中一致）
      proofHex    // 默克尔证明（bytes32[] 格式）
      ))
      .to.emit(merkleAirdrop, "RewardClaimed") // 验证领取事件触发
      .withArgs(0, userAddr, claimAmt, targetTime); // 验证事件参数（匹配合约事件定义）

    
      // 7. 验证领取结果（余额增加量=领取金额）
      const afterBal = await cswapToken.balanceOf(userAddr);
      const balanceDiff = afterBal - beforeBal;
      expect(balanceDiff).to.equal(claimAmt, "❌ 用户余额增加量与领取金额不符");
      console.log(`   💰 领取后用户余额：${ethers.formatEther(afterBal)} CSWAP`);
      console.log(`   💰 余额增加量：${ethers.formatEther(balanceDiff)} CSWAP`);

      // 8. 验证合约状态更新（已领取标记、已领取总金额）
      const isClaimed = await merkleAirdrop.claimed(0, userAddr); 
      const airdropInfo = await merkleAirdrop.getAirdropInfo(0);
      expect(isClaimed).to.be.true, "❌ 合约未标记用户为已领取";
      expect(airdropInfo.claimedReward).to.equal(claimAmt, "❌ 合约已领取总金额未更新");
      console.log(`   ✅ 合约状态验证通过：用户已标记为已领取，已领取总金额=${ethers.formatEther(airdropInfo.claimedReward)} CSWAP`);
    });

    // 用例2：用户重复领取奖励，应失败
    it("不能重复领取奖励（重复调用应回滚）", async function () {
      console.log("\n📝 测试用例2：用户1重复领取失败");
      const [user1Data] = testAccounts;
      const userAddr = user1Data.address;
      const claimAmt = user1Data.amount;
      const userSigner = await ethers.provider.getSigner(userAddr);

      // 1. 生成证明（与用例1一致）
      const userLeaf = await merkleAirdrop.calculateLeafHash(userAddr, claimAmt);
      const leafBuffer = Buffer.from(userLeaf.slice(2), "hex");
      const proofHex = merkleTree.getProof(leafBuffer).map(node => `0x${node.data.toString("hex")}`);

      // 2. 调整时间到有效期内
      await ethers.provider.send("evm_setNextBlockTimestamp", [this.airdropStartTime + 5]);
      await ethers.provider.send("evm_mine");

      // 3. 第一次领取（成功）
      await merkleAirdrop.connect(userSigner).claimReward(0, claimAmt, proofHex);
      console.log(`   ✅ 第一次领取成功`);

      // 4. 第二次领取（应失败，理由：Already claimed）
      await expect(merkleAirdrop.connect(userSigner).claimReward(0, claimAmt, proofHex))
        .to.be.revertedWith("Already claimed"); // 验证回滚理由
      console.log(`   ✅ 第二次领取失败（符合预期：已领取用户不能重复领取）`);
    });

    // 用例3：用户在空投开始前领取，应失败
    it("不能在空投开始前领取（时间未到应回滚）", async function () {
      console.log("\n📝 测试用例3：空投开始前领取失败");
      const [user1Data] = testAccounts;
      const userAddr = user1Data.address;
      const claimAmt = user1Data.amount;
      const userSigner = await ethers.provider.getSigner(userAddr);

      // 1. 生成证明（与用例1一致）
      const userLeaf = await merkleAirdrop.calculateLeafHash(userAddr, claimAmt);
      const leafBuffer = Buffer.from(userLeaf.slice(2), "hex");
      const proofHex = merkleTree.getProof(leafBuffer).map(node => `0x${node.data.toString("hex")}`);

      // 2. 调整时间到空投开始前（故意设置为无效时间）
      const targetTime = this.airdropStartTime - 5; // 开始时间前5秒
      await ethers.provider.send("evm_setNextBlockTimestamp", [targetTime]);
      await ethers.provider.send("evm_mine");
      const adjustedBlock = await ethers.provider.getBlock("latest");
      console.log(`   ⏰ 当前区块时间：${new Date(adjustedBlock.timestamp * 1000).toLocaleString()}`);
      console.log(`   ⏰ 空投开始时间：${new Date(this.airdropStartTime * 1000).toLocaleString()}`);

      // 3. 尝试领取（应失败，理由：Time expired 或自定义的“未到开始时间”理由）
      await expect(merkleAirdrop.connect(userSigner).claimReward(0, claimAmt, proofHex))
        .to.be.revertedWith("Time expired"); // 注意：需与合约中时间检查的 revert 理由一致
      console.log(`   ✅ 空投开始前领取失败（符合预期：时间未到）`);
    });

    // 用例4：用户使用无效证明领取，应失败
    it("不能用无效证明领取（证明错误应回滚）", async function () {
      console.log("\n📝 测试用例4：无效证明领取失败");
      const [user1Data, user2Data] = testAccounts; // 取 user1（领取用户）和 user2（用于生成错误证明）
      const user1Addr = user1Data.address;
      const user1Amt = user1Data.amount;
      const user2Addr = user2Data.address;
      const user2Amt = user2Data.amount;
      const user1Signer = await ethers.provider.getSigner(user1Addr);

      // 1. 生成错误证明：用 user2 的 leaf 生成证明，却用于 user1 领取
      const wrongLeaf = await merkleAirdrop.calculateLeafHash(user2Addr, user2Amt); // user2 的 leaf
      const wrongLeafBuffer = Buffer.from(wrongLeaf.slice(2), "hex");
      const wrongProofHex = merkleTree.getProof(wrongLeafBuffer).map(node => `0x${node.data.toString("hex")}`);
      console.log(`   ❌ 使用错误证明：基于 user2 的 leaf 生成，却用于 user1 领取`);

      // 2. 调整时间到有效期内
      await ethers.provider.send("evm_setNextBlockTimestamp", [this.airdropStartTime + 5]);
      await ethers.provider.send("evm_mine");

      // 3. 尝试用错误证明领取（应失败，理由：Invalid merkle proof）
      await expect(merkleAirdrop.connect(user1Signer).claimReward(0, user1Amt, wrongProofHex))
        .to.be.revertedWith("Invalid merkle proof"); // 验证回滚理由
      console.log(`   ✅ 无效证明领取失败（符合预期：证明与用户不匹配）`);
    });


  });

});
