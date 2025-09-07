const hre = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    
    console.log("Deploying Erc20Test...");
    const Erc20Test = await hre.ethers.getContractFactory("Erc20Test");
    const erc20 = await Erc20Test.deploy();
    await erc20.waitForDeployment();
    const erc20Address = await erc20.getAddress();
    console.log("Erc20Test deployed to:", erc20Address);

    console.log("Deploying Stake...");
    const Stake = await hre.ethers.getContractFactory("Stake");
    //数组里面可以放初始化参数
    const stakeProxy = await hre.upgrades.deployProxy(Stake, [], { kind:'uups',initializer: 'initialize' });
    await stakeProxy.waitForDeployment();
    const stakeProxyAddress = await stakeProxy.getAddress();
    console.log("stakeProxy uups deployed to:", stakeProxyAddress);
    const stakeImplementationAddress = await hre.upgrades.erc1967.getImplementationAddress(stakeProxyAddress);
    console.log("Stake implementation deployed to:", stakeImplementationAddress);

    const adminRole = await stakeProxy.ADMIN_ROLE(); // 获取 ADMIN_ROLE 的哈希值
    const isAdmin = await stakeProxy.hasRole(adminRole, deployer.address);
    console.log("Deployer is admin:", isAdmin); // 应输出 true
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});