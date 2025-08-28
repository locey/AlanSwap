require("@nomicfoundation/hardhat-toolbox");
//引入openzeppelin插件
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

// const INFURA_API_KEY = process.env.INFURA_API_KEY;
// const DEPLOYER = process.env.DEPLOYER;
// const USER1 = process.env.USER1;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // sepolia: {
    //   url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`, //替换为你的Infura项目ID
    //   accounts:[DEPLOYER,USER1] //私钥
    // }
  },
  namedAccounts: {
    deployer: { default: 0 },
    user1: { default: 1 },
  }
};
