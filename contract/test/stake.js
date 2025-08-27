const { expect ,assert } = require("chai");
const{ ethers, upgrades } = require("hardhat")
const { erc1967 } = require("@openzeppelin/hardhat-upgrades");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
describe("Stake", function () {
    let Stake, owner, addr1, addr2, stakeProxy, erc20, erc20Address,mockAggregator ;
    before(async function () {
        //部署预言机合约
        const MockAggregator = await ethers.getContractFactory("MockV3Aggregator");
        mockAggregator = await MockAggregator.deploy(8, 100000000000); // 1000.00000000 (8位小数)
        await mockAggregator.waitForDeployment();
        console.log("Mock 预言机地址:", mockAggregator.target);
        
        // const DataFeed = await ethers.getContractFactory("DataFeed");
        // const dataFeed = await DataFeed.deploy();
        // await dataFeed.waitForDeployment();

        Stake = await ethers.getContractFactory("Stake");
        stakeProxy = await upgrades.deployProxy(Stake, [],{ kind: 'uups' , initializer: 'initialize'});
        await stakeProxy.waitForDeployment();
        const proxyAddress = await stakeProxy.getAddress();
        console.log("Stake proxy deployed at:", proxyAddress);//打印代理合约地址
        //const implementationAddress = await erc1967.getImplementationAddress(proxyAddress);
        //console.log("Stake deployed at:", implementationAddress);//打印合约真实地址
        [owner, addr1, addr2] = await ethers.getSigners();
        console.log("Owner address:", owner.address);
        console.log("Addr1 address:", addr1.address);
        console.log("Addr2 address:", addr2.address);

        const erc20Test = await ethers.getContractFactory("erc20Test");
        erc20 = await erc20Test.deploy();
        await erc20.waitForDeployment();
        erc20Address = await erc20.getAddress()
        //分发一些测试代币
        erc20.mint(addr1.address, ethers.parseUnits("1000", 18));
        erc20.mint(addr2.address, ethers.parseUnits("1000", 18));
        erc20.mint(proxyAddress, ethers.parseUnits("1000", 18));//为合约分
    });
    
    it("check contract initialize ", async function () {
        const ADMIN_ROLE = await stakeProxy.ADMIN_ROLE(); // 自定义角色，合约中已定义为 public
        const UPGRADER_ROLE = await stakeProxy.UPGRADER_ROLE(); // 自定义角色，合约中已定义为 public

        console.log("\n=== 角色 bytes32 标识 ===");
        console.log("ADMIN_ROLE:", ADMIN_ROLE);
        console.log("UPGRADER_ROLE:", UPGRADER_ROLE);
        const hasDefaultAdmin = await stakeProxy.hasRole(ADMIN_ROLE, owner.address);
        console.log("Owner has ADMIN_ROLE:", hasDefaultAdmin);
    });
    
    describe("deposit Eth-------------------", async function () {
        let addr1EthBalanceBefore, receipt, stakeAmount;
        before("addr1 deposit Eth", async function () {
            //新增eth池子
            const proxyAddress = await stakeProxy.getAddress();
            await stakeProxy.addPool("ETH height", ethers.ZeroAddress, 86400, mockAggregator.target);//锁定一天
            const pools = await stakeProxy.getPools();
            //使用本身的eth进行质押
            addr1EthBalanceBefore = await ethers.provider.getBalance(addr1.address);
            // addr1 授权并质押
            stakeAmount = ethers.parseEther("100.0");
            //如果想验证金额，需要计算gas费
            const tx = await stakeProxy.connect(addr1).depositEth(0,{value : stakeAmount});
            receipt = await tx.wait();
        });
        it("check addr1 balance ", async function () {
            const addr1Balance = await ethers.provider.getBalance(addr1.address);
            console.log("质押100ETH后，剩余：",addr1Balance)
            assert.equal(addr1EthBalanceBefore - receipt.gasUsed * receipt.gasPrice - stakeAmount, addr1Balance,"余额不正确");
            console.log("-----54545");
            const addr1Info = await stakeProxy.connect(addr1).getUserInfo(0);
            console.log("Addr1 stake info:", addr1Info);

            const pools = await stakeProxy.getPools();
            console.log("\nPools:", pools);//打印质押池信息
        });
        describe("withdraw Eth ", async function () {
            before("set Daily SharePrice ", async function () {
                const currentTimeBefore = await time.latest();
                console.log("Current block timestamp before time increase:", currentTimeBefore);
                // 增加时间，模拟质押一段时间后再提取
                await time.increase(86500); // 增加86500秒
                const currentTimeAfter = await time.latest();
                console.log("Current block timestamp after time increase:", currentTimeAfter);
                //设置每日shareprice
                await stakeProxy.setDailySharePrice(currentTimeAfter, 1100);//上涨10%
            });
            it("check addr1 balance after withdraw", async function () {
                const addr1Balance = await ethers.provider.getBalance(addr1.address);
                console.log("初始金额",addr1Balance);
                // addr1 提取质押 50个eth
                const withdrawBalance = ethers.parseEther("50.0");
                const withdrawTx = await stakeProxy.connect(addr1).withdraw(0,withdrawBalance); //提取质押
                const withdrawReceipt  = await withdrawTx.wait();                               //Gas
                const withdrawGasCost = withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;
                
                const claimTx = await stakeProxy.connect(addr1).claimRewards(0);                //提取奖励
                const claimReceipt = await claimTx.wait();
                const claimGasCost = claimReceipt.gasUsed * claimReceipt.gasPrice               //Gas
                //withdrawBalance.mul().div()
                const reward = withdrawBalance * (1100n - 1000n) / 1000n;                       //计算奖励
                console.log("计算奖励为：",reward)
                const total = addr1Balance + withdrawBalance - withdrawGasCost + reward - claimGasCost;
                console.log("计算出来的金额为",total)
                const balance = await ethers.provider.getBalance(addr1.address);//这是查询出来的最后金额
                console.log("----",balance);
            });
        });
    });

    describe("deposit erc20-------------------", async function () {
        let addr1Eth20Before, receipt, stakeAmount, pools;
        before("addr1 deposit erc20", async function () {
            console.log("--------------------------------------------")
            //新增eth池子
            const proxyAddress = await stakeProxy.getAddress();
            await stakeProxy.addPool("erc20 height", erc20Address, 86400, mockAggregator.target);//锁定一天
            pools = await stakeProxy.getPools();
            //使用本身的eth进行质押
            addr1Eth20Before = await erc20.balanceOf(addr1.address);
            console.log("原有addr1erc20Before：" ,addr1Eth20Before)
            // addr1 授权并质押
            stakeAmount = ethers.parseEther("100.0");
            //需要先授权
            await erc20.connect(addr1).approve(await stakeProxy.getAddress(), stakeAmount);
            //如果想验证金额，需要计算gas费
            const tx = await stakeProxy.connect(addr1).deposit(pools.length - 1, stakeAmount);
            receipt = await tx.wait();
            console.log("--------------------------------------------")
        });
        it("check addr1 balance erc20 ", async function () {
            const addr1Balance = await erc20.balanceOf(addr1.address);
            assert.equal(addr1Eth20Before - stakeAmount, addr1Balance,"余额不正确");
            const addr1Info = await stakeProxy.connect(addr1).getUserInfo(pools.length - 1);
            console.log("Addr1 stake info:", addr1Info);
        });
        describe("withdraw erc20 ", async function () {
            before("set Daily SharePrice erc20 ", async function () {
                const currentTimeBefore = await time.latest();
                console.log("Current block timestamp before time increase:", currentTimeBefore);
                // 增加时间，模拟质押一段时间后再提取
                await time.increase(86500); // 增加86500秒
                const currentTimeAfter = await time.latest();
                console.log("Current block timestamp after time increase:", currentTimeAfter);
                //设置每日shareprice
                await stakeProxy.setDailySharePrice(currentTimeAfter, 1200);//上涨10%
            });
            it("check addr1 balance after withdraw erc20", async function () {
                const addr1Balance = await erc20.balanceOf(addr1.address);
                console.log("初始金额",addr1Balance);
                // addr1 提取质押 50个eth
                const withdrawBalance = ethers.parseEther("50.0");
                const withdrawTx = await stakeProxy.connect(addr1).withdraw(pools.length - 1,withdrawBalance); //提取质押
                const withdrawReceipt  = await withdrawTx.wait();                               //Gas
                const withdrawGasCost = withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;
                const addr1Info = await stakeProxy.connect(addr1).getUserInfo(pools.length - 1);

                const claimTx = await stakeProxy.connect(addr1).claimRewards(pools.length - 1);                //提取奖励
                const claimReceipt = await claimTx.wait();
                const claimGasCost = claimReceipt.gasUsed * claimReceipt.gasPrice               //Gas
                //withdrawBalance.mul().div()
                //这里值，应该获取，不应写死
                const reward = withdrawBalance * (1200n - 1100n) / 1100n;                       //计算奖励
                console.log("计算奖励为：",reward)
                const total = addr1Balance + withdrawBalance + reward;
                console.log("计算出来的金额为",total)
                const balance = await erc20.balanceOf(addr1.address);//这是查询出来的最后金额
                console.log("----",balance);
                const proxyBalance = await erc20.balanceOf(await stakeProxy.getAddress());//代理地址金额
                console.log("----",proxyBalance);
            });
        });
    });
});