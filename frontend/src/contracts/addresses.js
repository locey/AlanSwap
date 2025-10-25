/**
 * 智能合约地址配置
 * 从环境变量中读取合约地址
 */

export const ADDRESSES = {
  // Uniswap V2 Router 地址
  ROUTER: import.meta.env.VITE_ROUTER_ADDRESS || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',

  // Uniswap V2 Factory 地址
  FACTORY: import.meta.env.VITE_FACTORY_ADDRESS || '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',

  // WETH (Wrapped ETH) 地址
  WETH: import.meta.env.VITE_WETH_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
};

/**
 * 常用代币地址 (以太坊主网)
 */
export const TOKEN_ADDRESSES = {
  // 主要稳定币
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',

  // 主流代币
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',

  // WETH
  WETH: ADDRESSES.WETH,
};

/**
 * 根据链 ID 获取对应的合约地址
 * @param {number} chainId - 链 ID
 * @returns {object} 合约地址配置
 */
export const getAddressesByChainId = (chainId) => {
  // 主网配置
  if (chainId === 1) {
    return ADDRESSES;
  }

  // Sepolia 测试网配置
  if (chainId === 11155111) {
    return {
      ROUTER: '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008',
      FACTORY: '0x7E0987E5b3a30e3f2828572Bb659A548460a3003',
      WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    };
  }

  // Goerli 测试网配置（已废弃但保留兼容）
  if (chainId === 5) {
    return {
      ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      FACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      WETH: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    };
  }

  // 本地开发网络配置
  if (chainId === 31337 || chainId === 1337) {
    return {
      ROUTER: import.meta.env.VITE_LOCAL_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000',
      FACTORY: import.meta.env.VITE_LOCAL_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
      WETH: import.meta.env.VITE_LOCAL_WETH_ADDRESS || '0x0000000000000000000000000000000000000000',
    };
  }

  // 默认返回主网地址
  console.warn(`未配置链 ID ${chainId} 的合约地址，使用主网地址`);
  return ADDRESSES;
};

/**
 * 验证地址是否有效
 * @param {string} address - 以太坊地址
 * @returns {boolean} 地址是否有效
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default ADDRESSES;
