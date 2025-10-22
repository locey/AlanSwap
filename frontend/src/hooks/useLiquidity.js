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
import BigNumber from 'bignumber.js';
import { useRouterContract, useERC20Contract, usePairContract } from './useContract';
import { parseTokenAmount, getDeadline, parseError } from '../utils/web3';
import { isNativeToken } from '../config/tokens';

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

        const tokenContract = useERC20Contract(tokenAddress, true);

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

        const slippageFactor = new BigNumber(1).minus(
          new BigNumber(slippage).div(100)
        );

        const amountAMin = new BigNumber(amountAWei)
          .multipliedBy(slippageFactor)
          .toFixed(0);

        const amountBMin = new BigNumber(amountBWei)
          .multipliedBy(slippageFactor)
          .toFixed(0);

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

        // 1. 授权 Token
        console.log('Approving Token...');
        await approveToken(token, amountToken, decimalsToken);

        // 2. 计算最小数量（考虑滑点）
        const amountTokenWei = parseTokenAmount(amountToken, decimalsToken);
        const amountETHWei = parseTokenAmount(amountETH, 18);

        const slippageFactor = new BigNumber(1).minus(
          new BigNumber(slippage).div(100)
        );

        const amountTokenMin = new BigNumber(amountTokenWei)
          .multipliedBy(slippageFactor)
          .toFixed(0);

        const amountETHMin = new BigNumber(amountETHWei)
          .multipliedBy(slippageFactor)
          .toFixed(0);

        const deadline = getDeadline();

        console.log('Adding liquidity ETH:', {
          token,
          amountToken: amountTokenWei,
          amountETH: amountETHWei,
          amountTokenMin,
          amountETHMin,
          deadline,
        });

        // 3. 添加流动性（ETH + Token）
        const tx = await routerContract.addLiquidityETH(
          token,
          BigInt(amountTokenWei),
          BigInt(amountTokenMin),
          BigInt(amountETHMin),
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
        const pairContract = usePairContract(tokenA, tokenB);
        const pairAddress = await pairContract.getAddress();

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
        const wethAddress = process.env.VITE_WETH_ADDRESS;
        const pairContract = usePairContract(token, wethAddress);
        const pairAddress = await pairContract.getAddress();

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
