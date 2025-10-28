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
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { useERC20Contract } from './useContract';
import { useTokenPrice } from './useTokenPrice';
import { formatTokenAmount } from '../utils/web3';

// 导入 ABI
import PairABI from '../contracts/abis/Pair.json';
import FactoryABI from '../contracts/abis/Factory.json';
import { getAddressesByChainId } from '../contracts/addresses';

/**
 * 将 Viem PublicClient 转换为 ethers Provider
 */
function publicClientToProvider(publicClient) {
  const { chain, transport } = publicClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.BrowserProvider(transport, network);
  return provider;
}

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
    if (!tokenA || !tokenB || !publicClient) {
      setPoolInfo((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      setPoolInfo((prev) => ({ ...prev, loading: true, error: null }));

      // 1. 获取 Factory 合约并查询 Pair 地址
      const chainId = publicClient.chain.id;
      const addresses = getAddressesByChainId(chainId);
      const provider = publicClientToProvider(publicClient);

      // 将 ETH 零地址替换为 WETH 地址
      const actualTokenA = tokenA === '0x0000000000000000000000000000000000000000'
        ? addresses.WETH
        : tokenA;
      const actualTokenB = tokenB === '0x0000000000000000000000000000000000000000'
        ? addresses.WETH
        : tokenB;

      console.log('Querying pair for:', { actualTokenA, actualTokenB });

      const factoryContract = new ethers.Contract(
        addresses.FACTORY,
        FactoryABI,
        provider
      );

      const pairAddress = await factoryContract.getPair(actualTokenA, actualTokenB);

      console.log('Pair address fetched:', pairAddress);

      // 检查 Pair 是否存在
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        console.log('Pair does not exist (zero address)');
        setPoolInfo({
          pairAddress: null,
          reserve0: '0',
          reserve1: '0',
          token0: null,
          token1: null,
          totalSupply: '0',
          loading: false,
          error: null,
          isToken0: actualTokenA.toLowerCase() < actualTokenB.toLowerCase(),
        });
        return;
      }

      // 2. 创建 Pair 合约实例
      const pairContract = new ethers.Contract(pairAddress, PairABI, provider);

      // 3. 并行查询：储备量、token0、token1、总供应量
      const [reserves, token0Address, token1Address, totalSupply] =
        await Promise.all([
          pairContract.getReserves(),
          pairContract.token0(),
          pairContract.token1(),
          pairContract.totalSupply(),
        ]);

      // 4. 确定代币顺序（Uniswap V2 按地址排序）
      // 使用实际的代币地址（WETH 替换 ETH）
      const isToken0 = actualTokenA.toLowerCase() < actualTokenB.toLowerCase();

      setPoolInfo({
        pairAddress,
        reserve0: reserves[0].toString(),
        reserve1: reserves[1].toString(),
        token0: token0Address,
        token1: token1Address,
        totalSupply: totalSupply.toString(),
        loading: false,
        error: null,
        isToken0,
      });
    } catch (error) {
      console.error('Failed to fetch pool info:', error);
      setPoolInfo((prev) => ({
        ...prev,
        loading: false,
        error: error.message || '获取池子信息失败',
      }));
    }
  }, [tokenA, tokenB, publicClient]);

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
    console.log('useUserLiquidity effect triggered:', {
      lpTokenContract: !!lpTokenContract,
      address,
      pairAddress,
      poolLoading,
    });

    if (!lpTokenContract || !address || !pairAddress || poolLoading) {
      console.log('useUserLiquidity: skipping fetch due to missing dependencies');
      return;
    }

    const fetchUserLiquidity = async () => {
      try {
        setUserLiquidity((prev) => ({ ...prev, loading: true }));

        console.log('Fetching LP balance for:', { address, pairAddress });

        // 查询用户的 LP Token 余额
        const balance = await lpTokenContract.balanceOf(address);
        const lpBalance = balance.toString();

        console.log('LP Balance:', lpBalance);

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
      // 对于新池子，用户需要自己输入 amountB，我们不强制计算
      // 只有当用户同时输入了 amountA 和 amountB 时才计算 LP Token
      if (reserveABN.isZero() || reserveBBN.isZero()) {
        // 新池子不自动计算 amountB，让用户自己设定初始价格比例
        // LP Token 计算需要等待用户输入 amountB（在流动性页面处理）
        setCalculation({
          amountB: '0', // 对于新池子，返回 0 让上层组件知道需要用户输入
          sharePercent: '100',
          lpTokens: '0', // 暂时设为 0，实际计算在确认时进行
          loading: false,
        });
        return;
      }

      // 计算需要的 amountB = reserveB * amountA / reserveA
      // 向上取整并增加 1% 的缓冲，确保满足合约要求
      // 这个缓冲考虑了 toFixed 和 parseTokenAmount 之间的精度损失
      const amountBWeiExact = reserveBBN
        .multipliedBy(amountAWei)
        .div(reserveABN);

      const amountBWei = amountBWeiExact
        .multipliedBy(1.01) // 增加 1% 缓冲
        .decimalPlaces(0, BigNumber.ROUND_UP);

      const amountB = amountBWei
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
