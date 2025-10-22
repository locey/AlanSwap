/**
 * 流动性池信息查询 Hook
 *
 * 功能：
 * 1. 查询流动性池储备量
 * 2. 计算池子份额占比
 * 3. 查询用户的 LP Token 余额
 * 4. 计算用户可提取的代币数量
 * 5. 查询池子 TVL（总锁定价值）
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import BigNumber from 'bignumber.js';
import { usePairContract, useERC20Contract } from './useContract';
import { useTokenPrice } from './useTokenPrice';
import { formatTokenAmount } from '../utils/web3';

/**
 * 查询流动性池基础信息
 * @param {string} tokenA - 代币 A 地址
 * @param {string} tokenB - 代币 B 地址
 * @param {number} decimalsA - 代币 A 小数位
 * @param {number} decimalsB - 代币 B 小数位
 */
export function usePoolInfo(tokenA, tokenB, decimalsA = 18, decimalsB = 18) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const pairContract = usePairContract(tokenA, tokenB);

  const [poolInfo, setPoolInfo] = useState({
    pairAddress: null,
    reserve0: '0',
    reserve1: '0',
    token0: null,
    token1: null,
    totalSupply: '0',
    loading: true,
    error: null,
  });

  const fetchPoolInfo = useCallback(async () => {
    if (!pairContract || !tokenA || !tokenB || !publicClient) {
      setPoolInfo((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      setPoolInfo((prev) => ({ ...prev, loading: true, error: null }));

      // 获取 Pair 地址
      const pairAddress = await pairContract.getAddress();

      // 并行查询：储备量、token0、token1、总供应量
      const [reserves, token0Address, token1Address, totalSupply] =
        await Promise.all([
          pairContract.getReserves(),
          pairContract.token0(),
          pairContract.token1(),
          pairContract.totalSupply(),
        ]);

      // 确定代币顺序（Uniswap V2 按地址排序）
      const isToken0 =
        tokenA.toLowerCase() < tokenB.toLowerCase();

      setPoolInfo({
        pairAddress,
        reserve0: reserves[0].toString(),
        reserve1: reserves[1].toString(),
        token0: token0Address,
        token1: token1Address,
        totalSupply: totalSupply.toString(),
        loading: false,
        error: null,
        isToken0, // tokenA 是否为 token0
      });
    } catch (error) {
      console.error('Failed to fetch pool info:', error);
      setPoolInfo((prev) => ({
        ...prev,
        loading: false,
        error: error.message || '获取池子信息失败',
      }));
    }
  }, [pairContract, tokenA, tokenB, publicClient]);

  useEffect(() => {
    fetchPoolInfo();
  }, [fetchPoolInfo]);

  return {
    ...poolInfo,
    refetch: fetchPoolInfo,
  };
}

/**
 * 查询用户的流动性信息
 * @param {string} tokenA - 代币 A 地址
 * @param {string} tokenB - 代币 B 地址
 * @param {number} decimalsA - 代币 A 小数位
 * @param {number} decimalsB - 代币 B 小数位
 */
export function useUserLiquidity(
  tokenA,
  tokenB,
  decimalsA = 18,
  decimalsB = 18
) {
  const { address } = useAccount();
  const { pairAddress, reserve0, reserve1, totalSupply, isToken0, loading: poolLoading } =
    usePoolInfo(tokenA, tokenB, decimalsA, decimalsB);

  const [userLiquidity, setUserLiquidity] = useState({
    lpBalance: '0',
    sharePercent: '0',
    token0Amount: '0',
    token1Amount: '0',
    loading: true,
  });

  // 获取 LP Token 合约
  const lpTokenContract = useERC20Contract(pairAddress);

  useEffect(() => {
    if (!lpTokenContract || !address || !pairAddress || poolLoading) {
      return;
    }

    const fetchUserLiquidity = async () => {
      try {
        setUserLiquidity((prev) => ({ ...prev, loading: true }));

        // 查询用户的 LP Token 余额
        const balance = await lpTokenContract.balanceOf(address);
        const lpBalance = balance.toString();

        // 计算份额占比
        let sharePercent = '0';
        let token0Amount = '0';
        let token1Amount = '0';

        if (lpBalance !== '0' && totalSupply !== '0') {
          const balanceBN = new BigNumber(lpBalance);
          const totalSupplyBN = new BigNumber(totalSupply);
          const reserve0BN = new BigNumber(reserve0);
          const reserve1BN = new BigNumber(reserve1);

          // 份额占比 = LP余额 / 总供应量 * 100
          sharePercent = balanceBN
            .div(totalSupplyBN)
            .multipliedBy(100)
            .toFixed(6);

          // 可提取的代币数量 = 储备量 * LP余额 / 总供应量
          token0Amount = reserve0BN
            .multipliedBy(balanceBN)
            .div(totalSupplyBN)
            .toFixed(0);

          token1Amount = reserve1BN
            .multipliedBy(balanceBN)
            .div(totalSupplyBN)
            .toFixed(0);
        }

        setUserLiquidity({
          lpBalance,
          sharePercent,
          token0Amount,
          token1Amount,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to fetch user liquidity:', error);
        setUserLiquidity((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchUserLiquidity();
  }, [
    lpTokenContract,
    address,
    pairAddress,
    totalSupply,
    reserve0,
    reserve1,
    poolLoading,
  ]);

  // 根据 token 顺序返回正确的金额
  const tokenAAmount = isToken0 ? userLiquidity.token0Amount : userLiquidity.token1Amount;
  const tokenBAmount = isToken0 ? userLiquidity.token1Amount : userLiquidity.token0Amount;

  return {
    ...userLiquidity,
    tokenAAmount,
    tokenBAmount,
    formattedTokenAAmount: formatTokenAmount(tokenAAmount, decimalsA, 6),
    formattedTokenBAmount: formatTokenAmount(tokenBAmount, decimalsB, 6),
    formattedLPBalance: formatTokenAmount(userLiquidity.lpBalance, 18, 6),
  };
}

/**
 * 查询流动性池 TVL（总锁定价值）
 * @param {string} tokenA - 代币 A 地址
 * @param {string} tokenB - 代币 B 地址
 * @param {number} decimalsA - 代币 A 小数位
 * @param {number} decimalsB - 代币 B 小数位
 */
export function usePoolTVL(tokenA, tokenB, decimalsA = 18, decimalsB = 18) {
  const { reserve0, reserve1, isToken0, loading: poolLoading } = usePoolInfo(
    tokenA,
    tokenB,
    decimalsA,
    decimalsB
  );

  // 获取代币价格（需要相对于稳定币的价格）
  const { price: priceA, loading: priceLoadingA } = useTokenPrice(
    tokenA,
    process.env.VITE_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    decimalsA,
    6
  );

  const { price: priceB, loading: priceLoadingB } = useTokenPrice(
    tokenB,
    process.env.VITE_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimalsB,
    6
  );

  const [tvl, setTvl] = useState({
    totalUSD: '0',
    token0USD: '0',
    token1USD: '0',
    loading: true,
  });

  useEffect(() => {
    if (poolLoading || priceLoadingA || priceLoadingB) {
      setTvl((prev) => ({ ...prev, loading: true }));
      return;
    }

    try {
      // 根据 token 顺序获取正确的储备量和价格
      const reserveA = isToken0 ? reserve0 : reserve1;
      const reserveB = isToken0 ? reserve1 : reserve0;

      const reserveABN = new BigNumber(reserveA).div(
        new BigNumber(10).pow(decimalsA)
      );
      const reserveBBN = new BigNumber(reserveB).div(
        new BigNumber(10).pow(decimalsB)
      );

      const priceABN = new BigNumber(priceA || 0);
      const priceBBN = new BigNumber(priceB || 0);

      // 计算每个代币的 USD 价值
      const token0USD = reserveABN.multipliedBy(priceABN).toFixed(2);
      const token1USD = reserveBBN.multipliedBy(priceBBN).toFixed(2);

      // 总 TVL = 代币A价值 + 代币B价值
      const totalUSD = new BigNumber(token0USD)
        .plus(token1USD)
        .toFixed(2);

      setTvl({
        totalUSD,
        token0USD,
        token1USD,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to calculate TVL:', error);
      setTvl({
        totalUSD: '0',
        token0USD: '0',
        token1USD: '0',
        loading: false,
      });
    }
  }, [
    reserve0,
    reserve1,
    isToken0,
    priceA,
    priceB,
    decimalsA,
    decimalsB,
    poolLoading,
    priceLoadingA,
    priceLoadingB,
  ]);

  return tvl;
}

/**
 * 计算添加流动性所需的代币数量
 * @param {string} tokenA - 代币 A 地址
 * @param {string} tokenB - 代币 B 地址
 * @param {string} amountA - 代币 A 数量（用户输入）
 * @param {number} decimalsA - 代币 A 小数位
 * @param {number} decimalsB - 代币 B 小数位
 */
export function useCalculateAddLiquidity(
  tokenA,
  tokenB,
  amountA,
  decimalsA = 18,
  decimalsB = 18
) {
  const { reserve0, reserve1, isToken0, totalSupply, loading: poolLoading } =
    usePoolInfo(tokenA, tokenB, decimalsA, decimalsB);

  const [calculation, setCalculation] = useState({
    amountB: '0',
    sharePercent: '0',
    lpTokens: '0',
    loading: true,
  });

  useEffect(() => {
    if (poolLoading || !amountA || parseFloat(amountA) === 0) {
      setCalculation({
        amountB: '0',
        sharePercent: '0',
        lpTokens: '0',
        loading: false,
      });
      return;
    }

    try {
      // 根据 token 顺序获取正确的储备量
      const reserveA = isToken0 ? reserve0 : reserve1;
      const reserveB = isToken0 ? reserve1 : reserve0;

      const reserveABN = new BigNumber(reserveA);
      const reserveBBN = new BigNumber(reserveB);
      const totalSupplyBN = new BigNumber(totalSupply);

      // 将用户输入转为 Wei
      const amountAWei = new BigNumber(amountA).multipliedBy(
        new BigNumber(10).pow(decimalsA)
      );

      // 如果是新池子（储备量为0）
      if (reserveABN.isZero() || reserveBBN.isZero()) {
        setCalculation({
          amountB: '0',
          sharePercent: '100',
          lpTokens: amountAWei.sqrt().toFixed(0), // 初始 LP = sqrt(amountA * amountB)
          loading: false,
        });
        return;
      }

      // 计算需要的 amountB = reserveB * amountA / reserveA
      const amountBWei = reserveBBN
        .multipliedBy(amountAWei)
        .div(reserveABN)
        .toFixed(0);

      const amountB = new BigNumber(amountBWei)
        .div(new BigNumber(10).pow(decimalsB))
        .toFixed(6);

      // 计算将获得的 LP Token = min(amountA * totalSupply / reserveA, amountB * totalSupply / reserveB)
      const lpTokensA = amountAWei.multipliedBy(totalSupplyBN).div(reserveABN);
      const lpTokensB = new BigNumber(amountBWei)
        .multipliedBy(totalSupplyBN)
        .div(reserveBBN);

      const lpTokens = BigNumber.min(lpTokensA, lpTokensB).toFixed(0);

      // 计算份额占比 = lpTokens / (totalSupply + lpTokens) * 100
      const newTotalSupply = totalSupplyBN.plus(lpTokens);
      const sharePercent = new BigNumber(lpTokens)
        .div(newTotalSupply)
        .multipliedBy(100)
        .toFixed(6);

      setCalculation({
        amountB,
        sharePercent,
        lpTokens,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to calculate add liquidity:', error);
      setCalculation({
        amountB: '0',
        sharePercent: '0',
        lpTokens: '0',
        loading: false,
      });
    }
  }, [
    amountA,
    reserve0,
    reserve1,
    isToken0,
    totalSupply,
    decimalsA,
    decimalsB,
    poolLoading,
  ]);

  return calculation;
}
