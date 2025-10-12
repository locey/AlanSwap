require("@nomicfoundation/hardhat-toolbox");

require("@openzeppelin/hardhat-upgrades");
//加载环境变量
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.22",
  settings: {
    // 启用优化  
    optimizer: {
      enabled: true, //表示开启优化器
      runs: 50 //表示优化器的运行次数为50次
    },
    viaIR: true // 表示通过中间表示(IR)进行优化处理 ，影响合约文件编译后的大小
  },
  networks: {
    hardhat: {
       allowUnlimitedContractSize: true,
        // 允许连续区块使用相同时间戳（防止意外的时间重复错误）
      allowBlocksWithSameTimestamp: true
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts:[process.env.PK],
      saveDeployments: true,
      chainId: 1
    },
     // 本地网络配置
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    //测试网 sepolia
    sepolia: {
      url:`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts:[process.env.PK]
    }
  },
  etherscan: {
    // 如果想验证合约，需要配置 Etherscan API 密钥
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  }
};
