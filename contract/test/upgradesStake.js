const { expect ,assert } = require("chai");
const{ ethers, upgrades } = require("hardhat")
const { erc1967 } = require("@openzeppelin/hardhat-upgrades");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
describe("Stake Upgradeability", function () {
    let Stake, stake, stakeV2; //erc20, erc20Address;
    let owner, addr1, addr2;
    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        console.log("Owner address:", owner.address);
        console.log("Addr1 address:", addr1.address);
        console.log("Addr2 address:", addr2.address);
    
        // const erc20Test = await ethers.getContractFactory("Erc20Test");
        // erc20 = await erc20Test.deploy();
        // await erc20.waitForDeployment();
        // erc20Address = await erc20.getAddress()
        // console.log("Erc20Test deployed to:", erc20Address);
    
        Stake = await ethers.getContractFactory("Stake");
        stake = await upgrades.deployProxy(Stake, [], { initializer: 'initialize' });
        await stake.waitForDeployment();
        const stakeAddress = await stake.getAddress();
        console.log("StakeProxy deployed to:", stakeAddress);//代理地址
        const stakeImplementationAddress = await upgrades.erc1967.getImplementationAddress(stakeAddress);
        console.log("Stake implementation deployed to:", stakeImplementationAddress);
    });
    
    it("should upgrade the contract and retain state", async function () {
        // Stake some tokens
        // const stakeAmount = ethers.utils.parseUnits("100", 18);
        // await erc20.connect(addr1).approve(stake.getAddress(), stakeAmount);
        // await stake.connect(addr1).stakeTokens(erc20Address, stakeAmount);
    
        // const initialBalance = await stake.balances(addr1.address, erc20Address);
        // expect(initialBalance).to.equal(stakeAmount);
        const pools_ = await stake.getPools();
        console.log("Initial pools:", pools_);
        assert.equal(pools_.length,0);

        
        // Upgrade the contract
        const StakeV2 = await ethers.getContractFactory("StakeV2");
        stakeV2 = await upgrades.upgradeProxy(stake, StakeV2);
        await stakeV2.waitForDeployment();
        const upgradedAddress = await stakeV2.getAddress();//打印升级之后的代理地址
        console.log("Stake upgraded to:", upgradedAddress);
        const stakeImplementationAddress = await upgrades.erc1967.getImplementationAddress(upgradedAddress);
        console.log("StakeV2 implementation deployed to:", stakeImplementationAddress);
        // Verify the address remains the same
        expect(upgradedAddress).to.equal(await stake.getAddress());//验证两个代理地址是否相同
    
        const v2 = await stakeV2.getV2();
        console.log("V2 function output:", v2);
        expect(v2).to.equal(1);
    });
});