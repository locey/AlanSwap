/**
 * 流动性操作 Hook
 *
 * 功能：
 * 1. 添加流动性（Token + Token）
 * 2. 添加流动性（ETH + Token）
 * 3. 移除流动性（Token + Token）
 * 4. 移除流动性（ETH + Token）
 * 5. 授权管理
 */

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { useRouterContract } from './useContract';
import { parseTokenAmount, getDeadline, parseError } from '../utils/web3';
import { isNativeToken } from '../config/tokens';

// 导入合约 ABI
import ERC20ABI from '../contracts/abis/ERC20.json';
import PairABI from '../contracts/abis/Pair.json';
import FactoryABI from '../contracts/abis/Factory.json';
import { getAddressesByChainId } from '../contracts/addresses';

/**
 * 将 Viem WalletClient 转换为 ethers Signer
 */
async function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.BrowserProvider(transport, network);
  const signer = await provider.getSigner(account.address);
  return signer;
}

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
 * 创建 ERC20 合约实例（不使用 Hook）
 */
async function createERC20Contract(tokenAddress, walletClient) {
  const signer = await walletClientToSigner(walletClient);
  return new ethers.Contract(tokenAddress, ERC20ABI, signer);
}

/**
 * 获取 Pair 地址
 */
async function getPairAddress(tokenA, tokenB, publicClient) {
  const chainId = publicClient.chain.id;
  const addresses = getAddressesByChainId(chainId);
  const provider = publicClientToProvider(publicClient);
  const factoryContract = new ethers.Contract(addresses.FACTORY, FactoryABI, provider);
  return await factoryContract.getPair(tokenA, tokenB);
}

export function useLiquidity() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const routerContract = useRouterContract(true); // 需要 signer

  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  /**
   * 授权代币
   */
  const approveToken = useCallback(
    async (tokenAddress, amount, decimals = 18) => {
      if (!address || !routerContract || !walletClient) {
        throw new Error('请先连接钱包');
      }

      try {
        setApproving(true);
        setError(null);

        // 创建 ERC20 合约实例（不使用 Hook）
        const tokenContract = await createERC20Contract(tokenAddress, walletClient);

        // 检查当前授权额度
        const routerAddress = await routerContract.getAddress();
        const currentAllowance = await tokenContract.allowance(
          address,
          routerAddress
        );

        const amountWei = parseTokenAmount(amount, decimals);
        const amountBN = new BigNumber(amountWei);
        const allowanceBN = new BigNumber(currentAllowance.toString());

        // 如果授权额度足够，无需重新授权
        if (allowanceBN.gte(amountBN)) {
          console.log('Allowance sufficient, skipping approval');
          setApproving(false);
          return null;
        }

        // 执行授权（授权为无限大）
        const tx = await tokenContract.approve(
          routerAddress,
          BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        );

        console.log('Approval transaction sent:', tx.hash);

        // 等待交易确认
        await publicClient.waitForTransactionReceipt({ hash: tx.hash });

        console.log('Approval confirmed');
        setApproving(false);

        return tx.hash;
      } catch (err) {
        console.error('Approval failed:', err);
        setApproving(false);
        throw err;
      }
    },
    [address, routerContract, walletClient, publicClient]
  );

  /**
   * 添加流动性（Token + Token）
   */
  const addLiquidity = useCallback(
    async ({
      tokenA,
      tokenB,
      amountA,
      amountB,
      decimalsA = 18,
      decimalsB = 18,
      slippage = 0.5,
      onSuccess,
      onError,
    }) => {
      if (!address || !routerContract || !walletClient) {
        const error = '请先连接钱包';
        setError(error);
        onError?.(error);
        return;
      }

      try {
        setLoading(true);
        setAdding(true);
        setError(null);
        setTxHash(null);

        // 1. 授权 Token A
        console.log('Approving Token A...');
        await approveToken(tokenA, amountA, decimalsA);

        // 2. 授权 Token B
        console.log('Approving Token B...');
        await approveToken(tokenB, amountB, decimalsB);

        // 3. 计算最小数量（考虑滑点）
        const amountAWei = parseTokenAmount(amountA, decimalsA);
        const amountBWei = parseTokenAmount(amountB, decimalsB);

        // 使用标准滑点（amountB 已经在计算时增加了缓冲）
        const slippageFactor = new BigNumber(1).minus(
          new BigNumber(slippage).div(100)
        );

        const amountAMin = new BigNumber(amountAWei)
          .multipliedBy(slippageFactor)
          .decimalPlaces(0, BigNumber.ROUND_DOWN);

        const amountBMin = new BigNumber(amountBWei)
          .multipliedBy(slippageFactor)
          .decimalPlaces(0, BigNumber.ROUND_DOWN);

        const deadline = getDeadline();

        console.log('Adding liquidity:', {
          tokenA,
          tokenB,
          amountA: amountAWei,
          amountB: amountBWei,
          amountAMin,
          amountBMin,
          deadline,
        });

        // 4. 添加流动性
        const tx = await routerContract.addLiquidity(
          tokenA,
          tokenB,
          BigInt(amountAWei),
          BigInt(amountBWei),
          BigInt(amountAMin),
          BigInt(amountBMin),
          address,
          BigInt(deadline)
        );

        console.log('Add liquidity transaction sent:', tx.hash);
        setTxHash(tx.hash);

        // 5. 等待交易确认
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx.hash,
        });

        console.log('Add liquidity confirmed:', receipt);

        setLoading(false);
        setAdding(false);

        onSuccess?.({ hash: tx.hash, receipt });
      } catch (err) {
        console.error('Add liquidity failed:', err);
        const errorMessage = parseError(err);
        setError(errorMessage);
        setLoading(false);
        setAdding(false);
        onError?.(errorMessage);
      }
    },
    [address, routerContract, walletClient, publicClient, approveToken]
  );

  /**
   * 添加流动性（ETH + Token）
   */
  const addLiquidityETH = useCallback(
    async ({
      token,
      amountToken,
      amountETH,
      decimalsToken = 18,
      slippage = 0.5,
      onSuccess,
      onError,
    }) => {
      if (!address || !routerContract || !walletClient) {
        const error = '请先连接钱包';
        setError(error);
        onError?.(error);
        return;
      }

      try {
        setLoading(true);
        setAdding(true);
        setError(null);
        setTxHash(null);

        // 1. 获取当前池子储备量，重新计算精确的 amountToken
        const chainId = publicClient.chain.id;
        const addresses = getAddressesByChainId(chainId);
        const wethAddress = addresses.WETH;
        const pairAddress = await getPairAddress(token, wethAddress, publicClient);

        // 获取储备量
        const provider = publicClientToProvider(publicClient);
        const pairContract = new ethers.Contract(pairAddress, PairABI, provider);
        const [reserve0Raw, reserve1Raw] = await pairContract.getReserves();
        const token0 = await pairContract.token0();

        // 确定哪个是 token，哪个是 WETH
        const isToken0 = token.toLowerCase() < wethAddress.toLowerCase();
        const reserveToken = isToken0 ? reserve0Raw.toString() : reserve1Raw.toString();
        const reserveWETH = isToken0 ? reserve1Raw.toString() : reserve0Raw.toString();

        // 3. 重新计算精确的 amountToken
        const amountETHWei = parseTokenAmount(amountETH, 18);
        const reserveTokenBN = new BigNumber(reserveToken);
        const reserveWETHBN = new BigNumber(reserveWETH);
        const amountETHBN = new BigNumber(amountETHWei);

        // amountTokenOptimal = amountETH * reserveToken / reserveWETH (精确计算，向上取整)
        const amountTokenOptimalWei = amountETHBN
          .multipliedBy(reserveTokenBN)
          .div(reserveWETHBN)
          .decimalPlaces(0, BigNumber.ROUND_UP);

        // 2. 授权 Token（使用重新计算的数量 * 1.02 以确保足够）
        console.log('Approving Token...');
        const amountTokenForApproval = amountTokenOptimalWei
          .multipliedBy(1.02)
          .decimalPlaces(0, BigNumber.ROUND_UP);
        const amountTokenOptimalReadable = amountTokenForApproval
          .div(new BigNumber(10).pow(decimalsToken))
          .toFixed(decimalsToken);
        await approveToken(token, amountTokenOptimalReadable, decimalsToken);

        // 4. 计算最小数量（使用更宽松的容差）
        // 由于精度问题，我们需要更大的容差来避免交易失败
        const minSlippageFactor = new BigNumber(1).minus(
          new BigNumber(slippage).plus(0.5).div(100) // 额外 0.5% 容差
        );

        const amountTokenMin = amountTokenOptimalWei
          .multipliedBy(minSlippageFactor)
          .decimalPlaces(0, BigNumber.ROUND_DOWN);

        const amountETHMin = new BigNumber(amountETHWei)
          .multipliedBy(minSlippageFactor)
          .decimalPlaces(0, BigNumber.ROUND_DOWN);

        const deadline = getDeadline();

        console.log('Adding liquidity ETH (recalculated):', {
          token,
          amountTokenOriginal: parseTokenAmount(amountToken, decimalsToken),
          amountTokenOptimal: amountTokenOptimalWei.toFixed(0),
          amountETH: amountETHWei,
          amountTokenMin: amountTokenMin.toFixed(0),
          amountETHMin: amountETHMin.toFixed(0),
          deadline,
          reserveToken,
          reserveWETH,
        });

        // 5. 添加流动性（ETH + Token）- 使用重新计算的精确值
        const tx = await routerContract.addLiquidityETH(
          token,
          BigInt(amountTokenOptimalWei.toFixed(0)),
          BigInt(amountTokenMin.toFixed(0)),
          BigInt(amountETHMin.toFixed(0)),
          address,
          BigInt(deadline),
          { value: BigInt(amountETHWei) } // 发送 ETH
        );

        console.log('Add liquidity ETH transaction sent:', tx.hash);
        setTxHash(tx.hash);

        // 4. 等待交易确认
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx.hash,
        });

        console.log('Add liquidity ETH confirmed:', receipt);

        setLoading(false);
        setAdding(false);

        onSuccess?.({ hash: tx.hash, receipt });
      } catch (err) {
        console.error('Add liquidity ETH failed:', err);
        const errorMessage = parseError(err);
        setError(errorMessage);
        setLoading(false);
        setAdding(false);
        onError?.(errorMessage);
      }
    },
    [address, routerContract, walletClient, publicClient, approveToken]
  );

  /**
   * 移除流动性（Token + Token）
   */
  const removeLiquidity = useCallback(
    async ({
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      decimalsA = 18,
      decimalsB = 18,
      slippage = 0.5,
      onSuccess,
      onError,
    }) => {
      if (!address || !routerContract || !walletClient) {
        const error = '请先连接钱包';
        setError(error);
        onError?.(error);
        return;
      }

      try {
        setLoading(true);
        setRemoving(true);
        setError(null);
        setTxHash(null);

        // 1. 获取 Pair 地址
        const pairAddress = await getPairAddress(tokenA, tokenB, publicClient);

        // 2. 授权 LP Token
        console.log('Approving LP Token...');
        await approveToken(pairAddress, liquidity, 18); // LP Token 默认 18 位

        // 3. 计算最小接收数量（如果未提供）
        const liquidityWei = parseTokenAmount(liquidity, 18);

        const slippageFactor = new BigNumber(1).minus(
          new BigNumber(slippage).div(100)
        );

        const finalAmountAMin = amountAMin
          ? parseTokenAmount(amountAMin, decimalsA)
          : new BigNumber(0).toFixed(0); // 如果未提供，使用 0（高风险）

        const finalAmountBMin = amountBMin
          ? parseTokenAmount(amountBMin, decimalsB)
          : new BigNumber(0).toFixed(0);

        const deadline = getDeadline();

        console.log('Removing liquidity:', {
          tokenA,
          tokenB,
          liquidity: liquidityWei,
          amountAMin: finalAmountAMin,
          amountBMin: finalAmountBMin,
          deadline,
        });

        // 4. 移除流动性
        const tx = await routerContract.removeLiquidity(
          tokenA,
          tokenB,
          BigInt(liquidityWei),
          BigInt(finalAmountAMin),
          BigInt(finalAmountBMin),
          address,
          BigInt(deadline)
        );

        console.log('Remove liquidity transaction sent:', tx.hash);
        setTxHash(tx.hash);

        // 5. 等待交易确认
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx.hash,
        });

        console.log('Remove liquidity confirmed:', receipt);

        setLoading(false);
        setRemoving(false);

        onSuccess?.({ hash: tx.hash, receipt });
      } catch (err) {
        console.error('Remove liquidity failed:', err);
        const errorMessage = parseError(err);
        setError(errorMessage);
        setLoading(false);
        setRemoving(false);
        onError?.(errorMessage);
      }
    },
    [address, routerContract, walletClient, publicClient, approveToken]
  );

  /**
   * 移除流动性（ETH + Token）
   */
  const removeLiquidityETH = useCallback(
    async ({
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      decimalsToken = 18,
      slippage = 0.5,
      onSuccess,
      onError,
    }) => {
      if (!address || !routerContract || !walletClient) {
        const error = '请先连接钱包';
        setError(error);
        onError?.(error);
        return;
      }

      try {
        setLoading(true);
        setRemoving(true);
        setError(null);
        setTxHash(null);

        // 1. 获取 Pair 地址（token + WETH）
        const chainId = publicClient.chain.id;
        const addresses = getAddressesByChainId(chainId);
        const wethAddress = addresses.WETH;
        const pairAddress = await getPairAddress(token, wethAddress, publicClient);

        // 2. 授权 LP Token
        console.log('Approving LP Token...');
        await approveToken(pairAddress, liquidity, 18);

        // 3. 计算最小接收数量
        const liquidityWei = parseTokenAmount(liquidity, 18);

        const finalAmountTokenMin = amountTokenMin
          ? parseTokenAmount(amountTokenMin, decimalsToken)
          : new BigNumber(0).toFixed(0);

        const finalAmountETHMin = amountETHMin
          ? parseTokenAmount(amountETHMin, 18)
          : new BigNumber(0).toFixed(0);

        const deadline = getDeadline();

        console.log('Removing liquidity ETH:', {
          token,
          liquidity: liquidityWei,
          amountTokenMin: finalAmountTokenMin,
          amountETHMin: finalAmountETHMin,
          deadline,
        });

        // 4. 移除流动性（ETH + Token）
        const tx = await routerContract.removeLiquidityETH(
          token,
          BigInt(liquidityWei),
          BigInt(finalAmountTokenMin),
          BigInt(finalAmountETHMin),
          address,
          BigInt(deadline)
        );

        console.log('Remove liquidity ETH transaction sent:', tx.hash);
        setTxHash(tx.hash);

        // 5. 等待交易确认
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx.hash,
        });

        console.log('Remove liquidity ETH confirmed:', receipt);

        setLoading(false);
        setRemoving(false);

        onSuccess?.({ hash: tx.hash, receipt });
      } catch (err) {
        console.error('Remove liquidity ETH failed:', err);
        const errorMessage = parseError(err);
        setError(errorMessage);
        setLoading(false);
        setRemoving(false);
        onError?.(errorMessage);
      }
    },
    [address, routerContract, walletClient, publicClient, approveToken]
  );

  /**
   * 智能添加流动性（自动判断是否包含 ETH）
   */
  const addLiquiditySmart = useCallback(
    async (params) => {
      const { tokenA, tokenB } = params;

      // 检查是否包含 ETH
      if (isNativeToken(tokenA)) {
        // ETH + Token
        return addLiquidityETH({
          token: tokenB,
          amountToken: params.amountB,
          amountETH: params.amountA,
          decimalsToken: params.decimalsB,
          slippage: params.slippage,
          onSuccess: params.onSuccess,
          onError: params.onError,
        });
      } else if (isNativeToken(tokenB)) {
        // Token + ETH
        return addLiquidityETH({
          token: tokenA,
          amountToken: params.amountA,
          amountETH: params.amountB,
          decimalsToken: params.decimalsA,
          slippage: params.slippage,
          onSuccess: params.onSuccess,
          onError: params.onError,
        });
      } else {
        // Token + Token
        return addLiquidity(params);
      }
    },
    [addLiquidity, addLiquidityETH]
  );

  /**
   * 智能移除流动性（自动判断是否包含 ETH）
   */
  const removeLiquiditySmart = useCallback(
    async (params) => {
      const { tokenA, tokenB } = params;

      // 检查是否包含 ETH
      if (isNativeToken(tokenA) || isNativeToken(tokenB)) {
        const token = isNativeToken(tokenA) ? tokenB : tokenA;
        const decimalsToken = isNativeToken(tokenA)
          ? params.decimalsB
          : params.decimalsA;

        return removeLiquidityETH({
          token,
          liquidity: params.liquidity,
          amountTokenMin: isNativeToken(tokenA)
            ? params.amountBMin
            : params.amountAMin,
          amountETHMin: isNativeToken(tokenA)
            ? params.amountAMin
            : params.amountBMin,
          decimalsToken,
          slippage: params.slippage,
          onSuccess: params.onSuccess,
          onError: params.onError,
        });
      } else {
        // Token + Token
        return removeLiquidity(params);
      }
    },
    [removeLiquidity, removeLiquidityETH]
  );

  return {
    // 状态
    loading,
    approving,
    adding,
    removing,
    error,
    txHash,

    // 方法
    approveToken,
    addLiquidity,
    addLiquidityETH,
    removeLiquidity,
    removeLiquidityETH,
    addLiquiditySmart,
    removeLiquiditySmart,
  };
}
