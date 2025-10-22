/**
 * 代币配置列表
 * 包含常用代币的元数据和地址
 */

import { TOKEN_ADDRESSES } from '../contracts/addresses';

/**
 * 代币元数据结构
 * @typedef {Object} Token
 * @property {string} symbol - 代币符号
 * @property {string} name - 代币名称
 * @property {string} address - 代币合约地址
 * @property {number} decimals - 小数位数
 * @property {string} logoURI - 代币图标 URL
 * @property {number} chainId - 链 ID
 * @property {boolean} isNative - 是否是原生代币（ETH）
 */

/**
 * 以太坊主网代币列表
 */
export const MAINNET_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000', // 特殊地址表示 ETH
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
    chainId: 1,
    isNative: true,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: TOKEN_ADDRESSES.WETH,
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
    chainId: 1,
    isNative: false,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: TOKEN_ADDRESSES.USDT,
    decimals: 6,
    logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
    chainId: 1,
    isNative: false,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: TOKEN_ADDRESSES.USDC,
    decimals: 6,
    logoURI: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
    chainId: 1,
    isNative: false,
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: TOKEN_ADDRESSES.DAI,
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png',
    chainId: 1,
    isNative: false,
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: TOKEN_ADDRESSES.WBTC,
    decimals: 8,
    logoURI: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
    chainId: 1,
    isNative: false,
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    address: TOKEN_ADDRESSES.UNI,
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png',
    chainId: 1,
    isNative: false,
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    address: TOKEN_ADDRESSES.LINK,
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png',
    chainId: 1,
    isNative: false,
  },
];

/**
 * Sepolia 测试网代币列表
 */
export const SEPOLIA_TOKENS = [
  {
    symbol: 'ETH',
    name: 'Sepolia Ether',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png',
    chainId: 11155111,
    isNative: true,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
    chainId: 11155111,
    isNative: false,
  },
];

/**
 * 根据链 ID 获取代币列表
 * @param {number} chainId - 链 ID
 * @returns {Token[]} 代币列表
 */
export const getTokensByChainId = (chainId) => {
  switch (chainId) {
    case 1:
      return MAINNET_TOKENS;
    case 11155111:
      return SEPOLIA_TOKENS;
    case 5:
      // Goerli 已废弃，返回空数组
      return [];
    default:
      console.warn(`未配置链 ID ${chainId} 的代币列表`);
      return MAINNET_TOKENS;
  }
};

/**
 * 根据地址查找代币
 * @param {string} address - 代币地址
 * @param {number} chainId - 链 ID
 * @returns {Token|null} 代币信息
 */
export const findTokenByAddress = (address, chainId) => {
  const tokens = getTokensByChainId(chainId);
  const normalizedAddress = address.toLowerCase();

  return tokens.find(
    (token) => token.address.toLowerCase() === normalizedAddress
  ) || null;
};

/**
 * 根据符号查找代币
 * @param {string} symbol - 代币符号
 * @param {number} chainId - 链 ID
 * @returns {Token|null} 代币信息
 */
export const findTokenBySymbol = (symbol, chainId) => {
  const tokens = getTokensByChainId(chainId);
  return tokens.find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase()
  ) || null;
};

/**
 * 获取默认代币对
 * @param {number} chainId - 链 ID
 * @returns {Object} { tokenA, tokenB }
 */
export const getDefaultTokenPair = (chainId) => {
  const tokens = getTokensByChainId(chainId);

  return {
    tokenA: tokens[0], // ETH
    tokenB: tokens[2] || tokens[1], // USDT 或 WETH
  };
};

/**
 * 检查是否是原生代币（ETH）
 * @param {string} address - 代币地址
 * @returns {boolean} 是否是 ETH
 */
export const isNativeToken = (address) => {
  return (
    address === '0x0000000000000000000000000000000000000000' ||
    address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
  );
};

/**
 * 获取常用稳定币列表
 * @param {number} chainId - 链 ID
 * @returns {Token[]} 稳定币列表
 */
export const getStablecoins = (chainId) => {
  const tokens = getTokensByChainId(chainId);
  const stablecoinSymbols = ['USDT', 'USDC', 'DAI', 'BUSD'];

  return tokens.filter((token) =>
    stablecoinSymbols.includes(token.symbol.toUpperCase())
  );
};

/**
 * 代币列表排序
 * @param {Token[]} tokens - 代币列表
 * @param {string[]} balances - 余额映射 {address: balance}
 * @returns {Token[]} 排序后的代币列表
 */
export const sortTokensByBalance = (tokens, balances = {}) => {
  return [...tokens].sort((a, b) => {
    const balanceA = parseFloat(balances[a.address] || '0');
    const balanceB = parseFloat(balances[b.address] || '0');

    // 有余额的排前面
    if (balanceA > 0 && balanceB === 0) return -1;
    if (balanceA === 0 && balanceB > 0) return 1;

    // 都有余额，按余额大小排序
    if (balanceA > 0 && balanceB > 0) {
      return balanceB - balanceA;
    }

    // 都没余额，按原顺序
    return 0;
  });
};

export default {
  MAINNET_TOKENS,
  SEPOLIA_TOKENS,
  getTokensByChainId,
  findTokenByAddress,
  findTokenBySymbol,
  getDefaultTokenPair,
  isNativeToken,
  getStablecoins,
  sortTokensByBalance,
};
