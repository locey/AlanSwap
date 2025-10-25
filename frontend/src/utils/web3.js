/**
 * Web3 通用工具函数
 */

import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

/**
 * 格式化代币金额（从 Wei 转换为可读格式）
 * @param {string|BigNumber} amount - Wei 格式的金额
 * @param {number} decimals - 代币小数位数
 * @param {number} displayDecimals - 显示的小数位数
 * @returns {string} 格式化后的金额
 */
export const formatTokenAmount = (amount, decimals = 18, displayDecimals = 4) => {
  if (!amount) return '0';

  try {
    const bn = new BigNumber(amount.toString());
    const divisor = new BigNumber(10).pow(decimals);
    const result = bn.div(divisor);

    // 如果金额太小，显示更多小数位
    if (result.lt(0.0001) && result.gt(0)) {
      return result.toFixed(8);
    }

    return result.toFixed(displayDecimals);
  } catch (error) {
    console.error('格式化金额失败:', error);
    return '0';
  }
};

/**
 * 解析代币金额（从可读格式转换为 Wei）
 * @param {string} amount - 可读格式的金额
 * @param {number} decimals - 代币小数位数
 * @returns {string} Wei 格式的金额
 */
export const parseTokenAmount = (amount, decimals = 18) => {
  if (!amount || amount === '') return '0';

  try {
    const bn = new BigNumber(amount);
    const multiplier = new BigNumber(10).pow(decimals);
    return bn.times(multiplier).toFixed(0);
  } catch (error) {
    console.error('解析金额失败:', error);
    return '0';
  }
};

/**
 * 格式化以太坊地址（缩短显示）
 * @param {string} address - 完整地址
 * @param {number} prefixLength - 前缀长度
 * @param {number} suffixLength - 后缀长度
 * @returns {string} 格式化后的地址
 */
export const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address) return '';
  if (address.length < prefixLength + suffixLength) return address;

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * 验证以太坊地址是否有效
 * @param {string} address - 地址
 * @returns {boolean} 是否有效
 */
export const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * 验证金额是否有效
 * @param {string} amount - 金额
 * @returns {boolean} 是否有效
 */
export const isValidAmount = (amount) => {
  if (!amount || amount === '') return false;

  try {
    const bn = new BigNumber(amount);
    return bn.isFinite() && bn.gt(0);
  } catch {
    return false;
  }
};

/**
 * 计算滑点后的最小输出金额
 * @param {string} amount - 预期输出金额
 * @param {number} slippage - 滑点百分比（例如 0.5 表示 0.5%）
 * @returns {string} 最小输出金额
 */
export const calculateMinimumAmount = (amount, slippage = 0.5) => {
  try {
    const bn = new BigNumber(amount);
    const slippageMultiplier = new BigNumber(100 - slippage).div(100);
    return bn.times(slippageMultiplier).toFixed(0);
  } catch (error) {
    console.error('计算最小金额失败:', error);
    return '0';
  }
};

/**
 * 计算价格影响
 * @param {string} inputAmount - 输入金额
 * @param {string} outputAmount - 输出金额
 * @param {string} inputReserve - 输入代币储备量
 * @param {string} outputReserve - 输出代币储备量
 * @returns {string} 价格影响百分比
 */
export const calculatePriceImpact = (inputAmount, outputAmount, inputReserve, outputReserve) => {
  try {
    const input = new BigNumber(inputAmount);
    const output = new BigNumber(outputAmount);
    const reserveIn = new BigNumber(inputReserve);
    const reserveOut = new BigNumber(outputReserve);

    // 计算市场价格（交易前）
    const marketPrice = reserveOut.div(reserveIn);

    // 计算执行价格
    const executionPrice = output.div(input);

    // 计算价格影响
    const priceImpact = marketPrice
      .minus(executionPrice)
      .div(marketPrice)
      .times(100)
      .abs();

    return priceImpact.toFixed(2);
  } catch (error) {
    console.error('计算价格影响失败:', error);
    return '0';
  }
};

/**
 * 获取交易截止时间（当前时间 + 指定分钟数）
 * @param {number} minutes - 分钟数
 * @returns {number} Unix 时间戳
 */
export const getDeadline = (minutes = 20) => {
  return Math.floor(Date.now() / 1000) + minutes * 60;
};

/**
 * 格式化交易哈希
 * @param {string} hash - 交易哈希
 * @param {number} length - 显示长度
 * @returns {string} 格式化后的哈希
 */
export const formatTxHash = (hash, length = 10) => {
  if (!hash) return '';
  if (hash.length <= length) return hash;

  const prefixLength = Math.floor(length / 2);
  const suffixLength = length - prefixLength;
  return `${hash.slice(0, prefixLength + 2)}...${hash.slice(-suffixLength)}`;
};

/**
 * 获取区块浏览器 URL
 * @param {number} chainId - 链 ID
 * @param {string} hash - 交易哈希或地址
 * @param {string} type - 类型（'tx' 或 'address'）
 * @returns {string} 区块浏览器 URL
 */
export const getExplorerUrl = (chainId, hash, type = 'tx') => {
  const baseUrls = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
  };

  const baseUrl = baseUrls[chainId] || baseUrls[1];
  return `${baseUrl}/${type}/${hash}`;
};

/**
 * 等待交易确认
 * @param {object} tx - 交易对象
 * @param {number} confirmations - 确认数
 * @returns {Promise<object>} 交易收据
 */
export const waitForTransaction = async (tx, confirmations = 1) => {
  try {
    const receipt = await tx.wait(confirmations);
    return receipt;
  } catch (error) {
    console.error('等待交易确认失败:', error);
    throw error;
  }
};

/**
 * 处理错误信息
 * @param {Error} error - 错误对象
 * @returns {string} 用户友好的错误信息
 */
export const parseError = (error) => {
  if (!error) return '未知错误';

  // 用户拒绝交易
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return '用户取消了交易';
  }

  // 余额不足
  if (error.message?.includes('insufficient funds')) {
    return '余额不足，无法完成交易';
  }

  // Gas 费用不足
  if (error.message?.includes('gas')) {
    return 'Gas 费用不足或估算失败';
  }

  // 交易失败
  if (error.message?.includes('transaction failed')) {
    return '交易执行失败';
  }

  // 滑点过大
  if (error.message?.includes('K')) {
    return '价格波动过大，请增加滑点容忍度';
  }

  // 返回原始错误信息
  return error.message || error.reason || '交易失败';
};

/**
 * 格式化 Gas 费用
 * @param {string} gasPrice - Gas 价格（Wei）
 * @param {string} gasLimit - Gas 限制
 * @returns {string} 格式化后的费用（ETH）
 */
export const formatGasFee = (gasPrice, gasLimit) => {
  try {
    const price = new BigNumber(gasPrice);
    const limit = new BigNumber(gasLimit);
    const fee = price.times(limit);

    return formatTokenAmount(fee.toString(), 18, 6);
  } catch (error) {
    console.error('格式化 Gas 费用失败:', error);
    return '0';
  }
};

/**
 * 比较两个金额
 * @param {string} amount1 - 金额1
 * @param {string} amount2 - 金额2
 * @returns {number} 比较结果（1: amount1 > amount2, 0: 相等, -1: amount1 < amount2）
 */
export const compareAmounts = (amount1, amount2) => {
  try {
    const bn1 = new BigNumber(amount1);
    const bn2 = new BigNumber(amount2);

    if (bn1.gt(bn2)) return 1;
    if (bn1.lt(bn2)) return -1;
    return 0;
  } catch (error) {
    console.error('比较金额失败:', error);
    return 0;
  }
};

/**
 * 添加两个金额
 * @param {string} amount1 - 金额1
 * @param {string} amount2 - 金额2
 * @returns {string} 相加结果
 */
export const addAmounts = (amount1, amount2) => {
  try {
    const bn1 = new BigNumber(amount1);
    const bn2 = new BigNumber(amount2);
    return bn1.plus(bn2).toString();
  } catch (error) {
    console.error('金额相加失败:', error);
    return '0';
  }
};

/**
 * 减去两个金额
 * @param {string} amount1 - 金额1
 * @param {string} amount2 - 金额2
 * @returns {string} 相减结果
 */
export const subtractAmounts = (amount1, amount2) => {
  try {
    const bn1 = new BigNumber(amount1);
    const bn2 = new BigNumber(amount2);
    return bn1.minus(bn2).toString();
  } catch (error) {
    console.error('金额相减失败:', error);
    return '0';
  }
};

export default {
  formatTokenAmount,
  parseTokenAmount,
  formatAddress,
  isValidAddress,
  isValidAmount,
  calculateMinimumAmount,
  calculatePriceImpact,
  getDeadline,
  formatTxHash,
  getExplorerUrl,
  waitForTransaction,
  parseError,
  formatGasFee,
  compareAmounts,
  addAmounts,
  subtractAmounts,
};
