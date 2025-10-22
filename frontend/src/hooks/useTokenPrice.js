/**
 * 代币价格查询 Hook
 * 通过 Uniswap V2 流动性池计算代币价格
 */

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { usePairContract } from './useContract';
import { formatTokenAmount } from '../utils/web3';

/**
 * 查询代币对价格
 * @param {string} tokenA - 代币 A 地址
 * @param {string} tokenB - 代币 B 地址
 * @param {string} pairAddress - 流动性对地址（可选）
 * @returns {object} 价格信息
 */
export const useTokenPairPrice = (tokenA, tokenB, pairAddress = null) => {
  const [price, setPrice] = useState('0');
  const [inversePrice, setInversePrice] = useState('0');
  const [reserves, setReserves] = useState({ reserve0: '0', reserve1: '0' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pairContract = usePairContract(pairAddress, false);

  const fetchPrice = useCallback(async () => {
    if (!pairContract || !tokenA || !tokenB) {
      setPrice('0');
      setInversePrice('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 获取流动性对的储备量
      const [reserve0, reserve1] = await pairContract.getReserves();

      // 获取流动性对中的 token0 和 token1
      const token0 = await pairContract.token0();
      const token1 = await pairContract.token1();

      const reserve0Str = reserve0.toString();
      const reserve1Str = reserve1.toString();

      setReserves({
        reserve0: reserve0Str,
        reserve1: reserve1Str,
      });

      // 判断 tokenA 是 token0 还是 token1
      const isToken0 =
        token0.toLowerCase() === tokenA.toLowerCase();

      let priceValue, inversePriceValue;

      if (isToken0) {
        // tokenA = token0, tokenB = token1
        // price = reserve1 / reserve0
        const r0 = new BigNumber(reserve0Str);
        const r1 = new BigNumber(reserve1Str);
        priceValue = r1.div(r0).toString();
        inversePriceValue = r0.div(r1).toString();
      } else {
        // tokenA = token1, tokenB = token0
        // price = reserve0 / reserve1
        const r0 = new BigNumber(reserve0Str);
        const r1 = new BigNumber(reserve1Str);
        priceValue = r0.div(r1).toString();
        inversePriceValue = r1.div(r0).toString();
      }

      setPrice(priceValue);
      setInversePrice(inversePriceValue);
    } catch (err) {
      console.error('获取代币对价格失败:', err);
      setError(err.message);
      setPrice('0');
      setInversePrice('0');
    } finally {
      setLoading(false);
    }
  }, [pairContract, tokenA, tokenB]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return {
    price,
    inversePrice,
    reserves,
    loading,
    error,
    refetch: fetchPrice,
  };
};

/**
 * 查询代币 USD 价格
 * @param {string} tokenAddress - 代币地址
 * @param {string} stablecoinAddress - 稳定币地址（USDT/USDC）
 * @param {string} pairAddress - 流动性对地址
 * @returns {object} USD 价格信息
 */
export const useTokenUSDPrice = (
  tokenAddress,
  stablecoinAddress,
  pairAddress
) => {
  const {
    price,
    loading,
    error,
    refetch,
  } = useTokenPairPrice(tokenAddress, stablecoinAddress, pairAddress);

  const [usdPrice, setUsdPrice] = useState('0');
  const [formattedPrice, setFormattedPrice] = useState('$0.00');

  useEffect(() => {
    if (price && price !== '0') {
      setUsdPrice(price);

      // 格式化为美元价格
      const priceNum = parseFloat(price);
      if (priceNum >= 1) {
        setFormattedPrice(`$${priceNum.toFixed(2)}`);
      } else if (priceNum >= 0.01) {
        setFormattedPrice(`$${priceNum.toFixed(4)}`);
      } else {
        setFormattedPrice(`$${priceNum.toFixed(6)}`);
      }
    }
  }, [price]);

  return {
    usdPrice,
    formattedPrice,
    loading,
    error,
    refetch,
  };
};

/**
 * 批量查询代币价格
 * @param {Array<{tokenA: string, tokenB: string, pairAddress: string}>} pairs - 代币对列表
 * @returns {object} 价格信息映射
 */
export const useMultipleTokenPrices = (pairs = []) => {
  const publicClient = usePublicClient();
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrices = useCallback(async () => {
    if (!publicClient || !pairs.length) {
      setPrices({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const PairABI = (await import('../contracts/abis/Pair.json')).default;
      const provider = new ethers.BrowserProvider(publicClient.transport);

      const pricePromises = pairs.map(async ({ tokenA, tokenB, pairAddress }) => {
        try {
          const pairContract = new ethers.Contract(
            pairAddress,
            PairABI,
            provider
          );

          const [reserve0, reserve1, token0] = await Promise.all([
            pairContract.getReserves().then((r) => r[0]),
            pairContract.getReserves().then((r) => r[1]),
            pairContract.token0(),
          ]);

          const isToken0 = token0.toLowerCase() === tokenA.toLowerCase();

          const r0 = new BigNumber(reserve0.toString());
          const r1 = new BigNumber(reserve1.toString());

          const price = isToken0 ? r1.div(r0).toString() : r0.div(r1).toString();

          return {
            key: `${tokenA}-${tokenB}`,
            price,
          };
        } catch (err) {
          console.error(`获取 ${tokenA}-${tokenB} 价格失败:`, err);
          return {
            key: `${tokenA}-${tokenB}`,
            price: '0',
          };
        }
      });

      const results = await Promise.all(pricePromises);
      const pricesMap = {};

      results.forEach(({ key, price }) => {
        pricesMap[key] = price;
      });

      setPrices(pricesMap);
    } catch (err) {
      console.error('批量获取价格失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [publicClient, pairs]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices,
  };
};

/**
 * 计算代币价值（数量 × 价格）
 * @param {string} amount - 代币数量
 * @param {string} price - 代币价格
 * @param {number} decimals - 小数位
 * @returns {string} 价值
 */
export const calculateTokenValue = (amount, price, decimals = 18) => {
  try {
    const amountBN = new BigNumber(amount);
    const priceBN = new BigNumber(price);

    if (amountBN.isZero() || priceBN.isZero()) {
      return '0';
    }

    // 转换为可读格式
    const formattedAmount = formatTokenAmount(amount, decimals, 18);
    const value = new BigNumber(formattedAmount).times(priceBN);

    return value.toString();
  } catch (error) {
    console.error('计算代币价值失败:', error);
    return '0';
  }
};

export default {
  useTokenPairPrice,
  useTokenUSDPrice,
  useMultipleTokenPrices,
  calculateTokenValue,
};
