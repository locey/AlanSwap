/**
 * 交换报价计算 Hook
 * 计算交换金额、滑点、价格影响等
 */

import { useState, useEffect, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { useRouterContract } from './useContract';
import {
  parseTokenAmount,
  formatTokenAmount,
  calculateMinimumAmount,
  calculatePriceImpact,
} from '../utils/web3';

/**
 * 交换报价 Hook
 * @param {string} inputToken - 输入代币地址
 * @param {string} outputToken - 输出代币地址
 * @param {string} inputAmount - 输入金额（用户输入的可读格式）
 * @param {number} inputDecimals - 输入代币小数位
 * @param {number} outputDecimals - 输出代币小数位
 * @param {number} slippage - 滑点容忍度（百分比，如 0.5 表示 0.5%）
 * @returns {object} 报价信息
 */
export const useSwapQuote = (
  inputToken,
  outputToken,
  inputAmount,
  inputDecimals = 18,
  outputDecimals = 18,
  slippage = 0.5
) => {
  const router = useRouterContract(false);

  const [outputAmount, setOutputAmount] = useState('0');
  const [formattedOutputAmount, setFormattedOutputAmount] = useState('0');
  const [minimumOutput, setMinimumOutput] = useState('0');
  const [priceImpact, setPriceImpact] = useState('0');
  const [executionPrice, setExecutionPrice] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateQuote = useCallback(async () => {
    if (!router || !inputToken || !outputToken || !inputAmount || inputAmount === '0') {
      setOutputAmount('0');
      setFormattedOutputAmount('0');
      setMinimumOutput('0');
      setPriceImpact('0');
      setExecutionPrice('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 将输入金额转换为 Wei
      const amountIn = parseTokenAmount(inputAmount, inputDecimals);

      if (new BigNumber(amountIn).isZero()) {
        setOutputAmount('0');
        setFormattedOutputAmount('0');
        setMinimumOutput('0');
        setPriceImpact('0');
        setExecutionPrice('0');
        setLoading(false);
        return;
      }

      // 构建交换路径
      const path = [inputToken, outputToken];

      // 调用 Router 合约的 getAmountsOut
      const amounts = await router.getAmountsOut(amountIn, path);

      // amounts[0] = 输入金额, amounts[1] = 输出金额
      const amountOut = amounts[1].toString();

      setOutputAmount(amountOut);
      setFormattedOutputAmount(
        formatTokenAmount(amountOut, outputDecimals, 6)
      );

      // 计算最小输出金额（滑点保护）
      const minOut = calculateMinimumAmount(amountOut, slippage);
      setMinimumOutput(minOut);

      // 计算执行价格
      const inputBN = new BigNumber(amountIn);
      const outputBN = new BigNumber(amountOut);
      const price = outputBN.div(inputBN).toString();
      setExecutionPrice(price);

      // 计算价格影响（需要流动性池储备量）
      // 这里简化处理，实际应该从 Pair 合约获取储备量
      const impact = calculateApproximatePriceImpact(inputBN, outputBN);
      setPriceImpact(impact);
    } catch (err) {
      console.error('计算交换报价失败:', err);
      setError(err.message);
      setOutputAmount('0');
      setFormattedOutputAmount('0');
    } finally {
      setLoading(false);
    }
  }, [
    router,
    inputToken,
    outputToken,
    inputAmount,
    inputDecimals,
    outputDecimals,
    slippage,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateQuote();
    }, 300); // 防抖 300ms

    return () => clearTimeout(timer);
  }, [calculateQuote]);

  return {
    outputAmount,
    formattedOutputAmount,
    minimumOutput,
    priceImpact,
    executionPrice,
    loading,
    error,
    refetch: calculateQuote,
  };
};

/**
 * 反向计算：根据期望输出计算需要的输入
 * @param {string} inputToken - 输入代币地址
 * @param {string} outputToken - 输出代币地址
 * @param {string} outputAmount - 期望输出金额
 * @param {number} inputDecimals - 输入代币小数位
 * @param {number} outputDecimals - 输出代币小数位
 * @returns {object} 输入金额信息
 */
export const useSwapQuoteReverse = (
  inputToken,
  outputToken,
  outputAmount,
  inputDecimals = 18,
  outputDecimals = 18
) => {
  const router = useRouterContract(false);

  const [inputAmount, setInputAmount] = useState('0');
  const [formattedInputAmount, setFormattedInputAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateQuote = useCallback(async () => {
    if (!router || !inputToken || !outputToken || !outputAmount || outputAmount === '0') {
      setInputAmount('0');
      setFormattedInputAmount('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 将输出金额转换为 Wei
      const amountOut = parseTokenAmount(outputAmount, outputDecimals);

      if (new BigNumber(amountOut).isZero()) {
        setInputAmount('0');
        setFormattedInputAmount('0');
        setLoading(false);
        return;
      }

      // 构建交换路径
      const path = [inputToken, outputToken];

      // 调用 Router 合约的 getAmountsIn
      const amounts = await router.getAmountsIn(amountOut, path);

      // amounts[0] = 输入金额, amounts[1] = 输出金额
      const amountIn = amounts[0].toString();

      setInputAmount(amountIn);
      setFormattedInputAmount(
        formatTokenAmount(amountIn, inputDecimals, 6)
      );
    } catch (err) {
      console.error('反向计算报价失败:', err);
      setError(err.message);
      setInputAmount('0');
      setFormattedInputAmount('0');
    } finally {
      setLoading(false);
    }
  }, [
    router,
    inputToken,
    outputToken,
    outputAmount,
    inputDecimals,
    outputDecimals,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateQuote();
    }, 300);

    return () => clearTimeout(timer);
  }, [calculateQuote]);

  return {
    inputAmount,
    formattedInputAmount,
    loading,
    error,
    refetch: calculateQuote,
  };
};

/**
 * 计算交换路由（多跳）
 * @param {string} inputToken - 输入代币
 * @param {string} outputToken - 输出代币
 * @param {string} inputAmount - 输入金额
 * @param {string[]} intermediateTok - 中间代币列表（如 WETH）
 * @returns {object} 最佳路由信息
 */
export const useSwapRoute = (
  inputToken,
  outputToken,
  inputAmount,
  intermediateTokens = []
) => {
  const router = useRouterContract(false);

  const [bestRoute, setBestRoute] = useState([]);
  const [bestOutput, setBestOutput] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateBestRoute = useCallback(async () => {
    if (!router || !inputToken || !outputToken || !inputAmount) {
      setBestRoute([]);
      setBestOutput('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amountIn = inputAmount;

      // 直接路径
      const directPath = [inputToken, outputToken];

      // 多跳路径
      const multiHopPaths = intermediateTokens.map((intermediate) => [
        inputToken,
        intermediate,
        outputToken,
      ]);

      const allPaths = [directPath, ...multiHopPaths];

      // 并行计算所有路径的输出
      const results = await Promise.all(
        allPaths.map(async (path) => {
          try {
            const amounts = await router.getAmountsOut(amountIn, path);
            return {
              path,
              output: amounts[amounts.length - 1].toString(),
            };
          } catch (err) {
            return {
              path,
              output: '0',
            };
          }
        })
      );

      // 找出输出最大的路径
      let maxOutput = new BigNumber('0');
      let maxPath = directPath;

      results.forEach(({ path, output }) => {
        const outputBN = new BigNumber(output);
        if (outputBN.gt(maxOutput)) {
          maxOutput = outputBN;
          maxPath = path;
        }
      });

      setBestRoute(maxPath);
      setBestOutput(maxOutput.toString());
    } catch (err) {
      console.error('计算最佳路由失败:', err);
      setError(err.message);
      setBestRoute([inputToken, outputToken]);
      setBestOutput('0');
    } finally {
      setLoading(false);
    }
  }, [router, inputToken, outputToken, inputAmount, intermediateTokens]);

  useEffect(() => {
    calculateBestRoute();
  }, [calculateBestRoute]);

  return {
    bestRoute,
    bestOutput,
    loading,
    error,
    refetch: calculateBestRoute,
  };
};

/**
 * 简化的价格影响计算
 * 实际应用中应该从流动性池获取储备量精确计算
 */
const calculateApproximatePriceImpact = (inputAmount, outputAmount) => {
  try {
    // 这是一个简化的估算
    // 真实的价格影响需要流动性池的储备量
    const inputBN = new BigNumber(inputAmount);
    const outputBN = new BigNumber(outputAmount);

    // 假设线性关系（实际是非线性）
    const ratio = outputBN.div(inputBN);

    // 简化计算：输入越大，影响越大
    const impact = inputBN
      .div(new BigNumber(10).pow(20))
      .times(100)
      .toFixed(2);

    return Math.min(parseFloat(impact), 50).toFixed(2);
  } catch (error) {
    return '0';
  }
};

export default {
  useSwapQuote,
  useSwapQuoteReverse,
  useSwapRoute,
};
