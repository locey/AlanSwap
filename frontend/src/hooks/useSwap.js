/**
 * 交换交易 Hook
 * 处理完整的 Swap 流程：检查余额、授权、执行交易
 */

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import BigNumber from 'bignumber.js';
import { useRouterContract, useERC20Contract } from './useContract';
import { useTokenBalance, useTokenAllowance } from './useTokenBalance';
import { useContractAddresses } from './useContract';
import {
  parseTokenAmount,
  getDeadline,
  waitForTransaction,
  parseError,
  compareAmounts,
} from '../utils/web3';
import { isNativeToken } from '../config/tokens';

/**
 * Swap Hook
 * @returns {object} Swap 相关方法和状态
 */
export const useSwap = () => {
  const { address: account } = useAccount();
  const router = useRouterContract(true);
  const addresses = useContractAddresses();

  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  /**
   * 检查并授权代币
   * @param {string} tokenAddress - 代币地址
   * @param {string} amount - 授权金额（Wei）
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onError - 失败回调
   */
  const approveToken = useCallback(
    async (tokenAddress, amount, onSuccess, onError) => {
      if (!account || !router || isNativeToken(tokenAddress)) {
        return;
      }

      setApproving(true);
      setError(null);

      try {
        // 等待合约实例创建
        const tokenContractPromise = useERC20Contract(tokenAddress, true);
        const tokenContract = await tokenContractPromise;

        if (!tokenContract) {
          throw new Error('无法创建代币合约实例');
        }

        // 检查当前授权额度
        const currentAllowance = await tokenContract.allowance(
          account,
          addresses.ROUTER
        );

        // 如果已授权足够，直接返回
        if (new BigNumber(currentAllowance.toString()).gte(amount)) {
          setApproving(false);
          if (onSuccess) onSuccess();
          return;
        }

        // 执行授权交易
        const approveTx = await tokenContract.approve(
          addresses.ROUTER,
          amount
        );

        setTxHash(approveTx.hash);

        // 等待交易确认
        await waitForTransaction(approveTx);

        setApproving(false);
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('授权失败:', err);
        const errorMsg = parseError(err);
        setError(errorMsg);
        setApproving(false);
        if (onError) onError(errorMsg);
      }
    },
    [account, router, addresses]
  );

  /**
   * 执行代币到代币的交换
   * @param {Object} params - 交换参数
   * @returns {Promise<Object>} 交易收据
   */
  const swapTokensForTokens = useCallback(
    async ({
      inputToken,
      outputToken,
      inputAmount,
      minimumOutput,
      inputDecimals = 18,
      path = null,
      deadlineMinutes = 20,
      onSuccess,
      onError,
    }) => {
      if (!account || !router) {
        throw new Error('钱包未连接或合约未初始化');
      }

      setSwapping(true);
      setError(null);

      try {
        // 等待 router 合约实例
        const routerContract = await router;

        // 转换金额为 Wei
        const amountIn = parseTokenAmount(inputAmount, inputDecimals);

        // 构建路径
        const swapPath = path || [inputToken, outputToken];

        // 计算截止时间
        const deadline = getDeadline(deadlineMinutes);

        // 执行交换
        const swapTx = await routerContract.swapExactTokensForTokens(
          amountIn,
          minimumOutput,
          swapPath,
          account,
          deadline
        );

        setTxHash(swapTx.hash);

        // 等待交易确认
        const receipt = await waitForTransaction(swapTx);

        setSwapping(false);
        setTxHash(null);

        if (onSuccess) {
          onSuccess({
            hash: swapTx.hash,
            receipt,
          });
        }

        return receipt;
      } catch (err) {
        console.error('交换失败:', err);
        const errorMsg = parseError(err);
        setError(errorMsg);
        setSwapping(false);
        setTxHash(null);

        if (onError) {
          onError(errorMsg);
        }

        throw err;
      }
    },
    [account, router]
  );

  /**
   * 执行 ETH 到代币的交换
   * @param {Object} params - 交换参数
   * @returns {Promise<Object>} 交易收据
   */
  const swapETHForTokens = useCallback(
    async ({
      outputToken,
      inputAmount,
      minimumOutput,
      path = null,
      deadlineMinutes = 20,
      onSuccess,
      onError,
    }) => {
      if (!account || !router) {
        throw new Error('钱包未连接或合约未初始化');
      }

      setSwapping(true);
      setError(null);

      try {
        // 等待 router 合约实例
        const routerContract = await router;

        // ETH 金额已经是 Wei 格式
        const amountIn = parseTokenAmount(inputAmount, 18);

        // 构建路径（WETH -> Token）
        const swapPath = path || [addresses.WETH, outputToken];

        // 计算截止时间
        const deadline = getDeadline(deadlineMinutes);

        // 执行交换（发送 ETH）
        const swapTx = await routerContract.swapExactETHForTokens(
          minimumOutput,
          swapPath,
          account,
          deadline,
          {
            value: amountIn,
          }
        );

        setTxHash(swapTx.hash);

        // 等待交易确认
        const receipt = await waitForTransaction(swapTx);

        setSwapping(false);
        setTxHash(null);

        if (onSuccess) {
          onSuccess({
            hash: swapTx.hash,
            receipt,
          });
        }

        return receipt;
      } catch (err) {
        console.error('ETH 交换失败:', err);
        const errorMsg = parseError(err);
        setError(errorMsg);
        setSwapping(false);
        setTxHash(null);

        if (onError) {
          onError(errorMsg);
        }

        throw err;
      }
    },
    [account, router, addresses]
  );

  /**
   * 执行代币到 ETH 的交换
   * @param {Object} params - 交换参数
   * @returns {Promise<Object>} 交易收据
   */
  const swapTokensForETH = useCallback(
    async ({
      inputToken,
      inputAmount,
      minimumOutput,
      inputDecimals = 18,
      path = null,
      deadlineMinutes = 20,
      onSuccess,
      onError,
    }) => {
      if (!account || !router) {
        throw new Error('钱包未连接或合约未初始化');
      }

      setSwapping(true);
      setError(null);

      try {
        // 等待 router 合约实例
        const routerContract = await router;

        // 转换金额为 Wei
        const amountIn = parseTokenAmount(inputAmount, inputDecimals);

        // 构建路径（Token -> WETH）
        const swapPath = path || [inputToken, addresses.WETH];

        // 计算截止时间
        const deadline = getDeadline(deadlineMinutes);

        // 执行交换
        const swapTx = await routerContract.swapExactTokensForETH(
          amountIn,
          minimumOutput,
          swapPath,
          account,
          deadline
        );

        setTxHash(swapTx.hash);

        // 等待交易确认
        const receipt = await waitForTransaction(swapTx);

        setSwapping(false);
        setTxHash(null);

        if (onSuccess) {
          onSuccess({
            hash: swapTx.hash,
            receipt,
          });
        }

        return receipt;
      } catch (err) {
        console.error('代币换 ETH 失败:', err);
        const errorMsg = parseError(err);
        setError(errorMsg);
        setSwapping(false);
        setTxHash(null);

        if (onError) {
          onError(errorMsg);
        }

        throw err;
      }
    },
    [account, router, addresses]
  );

  /**
   * 智能交换：自动判断交换类型
   * @param {Object} params - 交换参数
   * @returns {Promise<Object>} 交易收据
   */
  const executeSwap = useCallback(
    async (params) => {
      const { inputToken, outputToken } = params;

      // ETH -> Token
      if (isNativeToken(inputToken)) {
        return swapETHForTokens(params);
      }

      // Token -> ETH
      if (isNativeToken(outputToken)) {
        return swapTokensForETH(params);
      }

      // Token -> Token
      return swapTokensForTokens(params);
    },
    [swapETHForTokens, swapTokensForETH, swapTokensForTokens]
  );

  /**
   * 完整的交换流程：检查、授权、交换
   * @param {Object} params - 交换参数
   */
  const swap = useCallback(
    async (params) => {
      const { inputToken, inputAmount, inputDecimals = 18 } = params;

      setLoading(true);

      try {
        // 1. 如果是代币（非 ETH），检查并授权
        if (!isNativeToken(inputToken)) {
          const amountIn = parseTokenAmount(inputAmount, inputDecimals);

          await new Promise((resolve, reject) => {
            approveToken(
              inputToken,
              amountIn,
              () => resolve(),
              (error) => reject(new Error(error))
            );
          });
        }

        // 2. 执行交换
        const receipt = await executeSwap(params);

        setLoading(false);
        return receipt;
      } catch (err) {
        setLoading(false);
        throw err;
      }
    },
    [approveToken, executeSwap]
  );

  return {
    swap,
    approveToken,
    swapTokensForTokens,
    swapETHForTokens,
    swapTokensForETH,
    executeSwap,
    loading,
    approving,
    swapping,
    error,
    txHash,
  };
};

export default useSwap;
