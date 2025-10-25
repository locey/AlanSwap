/**
 * 交换页面 - 集成真实的区块链交互
 */

import { useState, useEffect } from 'react';
import { ArrowUpDown, Settings } from 'lucide-react';
import { useAccount, usePublicClient } from 'wagmi';
import toast from 'react-hot-toast';

// Hooks
import { useTokenBalance, useETHBalance } from '../hooks/useTokenBalance';
import { useSwapQuote } from '../hooks/useSwapQuote';
import { useSwap } from '../hooks/useSwap';

// Config & Utils
import { getTokensByChainId, isNativeToken } from '../config/tokens';
import { formatTokenAmount, getExplorerUrl, parseError } from '../utils/web3';

// Components
import SwapConfirmModal from '../components/SwapConfirmModal';

export default function SwapPage() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();

  // 获取代币列表
  const tokens = getTokensByChainId(chain?.id || 1);

  // 代币选择
  const [inputToken, setInputToken] = useState(tokens[0]); // ETH
  const [outputToken, setOutputToken] = useState(tokens[2] || tokens[1]); // USDT

  // 输入金额
  const [inputAmount, setInputAmount] = useState('');

  // 滑点设置
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // 确认弹窗
  const [showConfirm, setShowConfirm] = useState(false);

  // 查询输入代币余额
  const {
    balance: inputBalance,
    formattedBalance: inputFormattedBalance,
    refetch: refetchInputBalance,
  } = isNativeToken(inputToken.address)
    ? useETHBalance()
    : useTokenBalance(inputToken.address);

  // 查询输出代币余额
  const { refetch: refetchOutputBalance } = isNativeToken(outputToken.address)
    ? useETHBalance()
    : useTokenBalance(outputToken.address);

  // 获取交换报价
  const {
    outputAmount,
    formattedOutputAmount,
    minimumOutput,
    priceImpact,
    executionPrice,
    loading: quoteLoading,
    error: quoteError,
  } = useSwapQuote(
    inputToken.address,
    outputToken.address,
    inputAmount,
    inputToken.decimals,
    outputToken.decimals,
    slippage
  );

  // 交换 Hook
  const { swap, loading: swapLoading, approving, swapping } = useSwap();

  // 处理代币交换（输入输出互换）
  const handleSwapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
    setInputAmount(''); // 清空输入
  };

  // 检查是否是 ETH <-> WETH 组合
  const isETHWETHPair = () => {
    const ethAddresses = ['0x0000000000000000000000000000000000000000'];
    const wethAddress = tokens.find(t => t.symbol === 'WETH')?.address.toLowerCase();

    const inputIsETH = ethAddresses.includes(inputToken.address.toLowerCase());
    const outputIsWETH = outputToken.address.toLowerCase() === wethAddress;
    const inputIsWETH = inputToken.address.toLowerCase() === wethAddress;
    const outputIsETH = ethAddresses.includes(outputToken.address.toLowerCase());

    return (inputIsETH && outputIsWETH) || (inputIsWETH && outputIsETH);
  };

  // 快速设置输入金额
  const setMaxAmount = () => {
    if (inputFormattedBalance) {
      // ETH 需要预留 gas 费
      if (isNativeToken(inputToken.address)) {
        const maxAmount = Math.max(
          0,
          parseFloat(inputFormattedBalance) - 0.01
        );
        setInputAmount(maxAmount.toString());
      } else {
        setInputAmount(inputFormattedBalance);
      }
    }
  };

  // 处理交换确认
  const handleConfirm = async () => {
    if (!address) {
      toast.error('请先连接钱包');
      return;
    }

    const toastId = toast.loading('准备交换...');

    try {
      await swap({
        inputToken: inputToken.address,
        outputToken: outputToken.address,
        inputAmount,
        minimumOutput,
        inputDecimals: inputToken.decimals,
        onSuccess: ({ hash }) => {
          toast.success(
            <div className="flex flex-col gap-1">
              <div className="font-semibold">交换成功！</div>
              <a
                href={getExplorerUrl(chain.id, hash, 'tx')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                查看交易详情 →
              </a>
            </div>,
            { id: toastId, duration: 6000 }
          );

          // 关闭弹窗
          setShowConfirm(false);

          // 清空输入
          setInputAmount('');

          // 刷新余额
          refetchInputBalance();
          refetchOutputBalance();
        },
        onError: (error) => {
          toast.error(error, { id: toastId });
          setShowConfirm(false);
        },
      });
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  // 检查是否可以交换
  const canSwap =
    address &&
    inputAmount &&
    parseFloat(inputAmount) > 0 &&
    outputAmount &&
    outputAmount !== '0' &&
    parseFloat(inputFormattedBalance) >= parseFloat(inputAmount) &&
    !isETHWETHPair(); // 禁止 ETH <-> WETH 直接交换

  const priceImpactWarning = parseFloat(priceImpact) > 5;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 交换卡片 */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        {/* 标题和设置 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">交换</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 滑点设置 */}
        {showSettings && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div className="text-sm text-slate-400 mb-3">滑点容忍度</div>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0, 3.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    slippage === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              您的交易将在价格不利变动超过此百分比时回滚
            </div>
          </div>
        )}

        {/* 输入代币 */}
        <div className="relative mb-2">
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">卖出</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">
                  余额: {inputFormattedBalance || '0'} {inputToken.symbol}
                </span>
                <button
                  onClick={setMaxAmount}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  最大
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={inputToken.address}
                onChange={(e) => {
                  const token = tokens.find((t) => t.address === e.target.value);
                  setInputToken(token);
                  setInputAmount(''); // 切换代币时清空输入
                }}
                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-white text-right text-2xl font-semibold focus:outline-none"
                disabled={!address}
              />
            </div>
          </div>
        </div>

        {/* 交换按钮 */}
        <div className="flex justify-center my-4">
          <button
            onClick={handleSwapTokens}
            className="bg-slate-700/50 hover:bg-slate-600/50 p-3 rounded-full border border-slate-600/30 transition-all hover:scale-110"
          >
            <ArrowUpDown className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* 输出代币 */}
        <div className="relative mb-4">
          <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">买入</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={outputToken.address}
                onChange={(e) => {
                  const token = tokens.find((t) => t.address === e.target.value);
                  setOutputToken(token);
                }}
                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
              <div className="flex-1 text-right">
                {quoteLoading ? (
                  <div className="text-2xl font-semibold text-slate-400 animate-pulse">
                    计算中...
                  </div>
                ) : (
                  <div className="text-2xl font-semibold text-white">
                    {formattedOutputAmount || '0.0'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 交易详情 */}
        {inputAmount && outputAmount !== '0' && !quoteError && (
          <div className="bg-slate-800/30 rounded-xl p-4 mb-4 border border-slate-700/20 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">执行价格</span>
              <span className="text-white">
                1 {inputToken.symbol} ≈{' '}
                {parseFloat(executionPrice).toFixed(6)} {outputToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">最小输出</span>
              <span className="text-white">
                {formatTokenAmount(minimumOutput, outputToken.decimals, 6)}{' '}
                {outputToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">价格影响</span>
              <span
                className={
                  priceImpactWarning ? 'text-yellow-400' : 'text-green-400'
                }
              >
                {priceImpact}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">滑点容忍</span>
              <span className="text-white">{slippage}%</span>
            </div>
          </div>
        )}

        {/* ETH <-> WETH 提示 */}
        {isETHWETHPair() && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            ETH 和 WETH 是 1:1 包装关系，请使用 Wrap/Unwrap 功能（暂不支持通过 Swap）
          </div>
        )}

        {/* 错误提示 */}
        {quoteError && inputAmount && !isETHWETHPair() && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {parseError({ message: quoteError })}
          </div>
        )}

        {/* 余额不足提示 */}
        {inputAmount &&
          parseFloat(inputAmount) > 0 &&
          inputFormattedBalance &&
          parseFloat(inputFormattedBalance) < parseFloat(inputAmount) && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
              余额不足
            </div>
          )}

        {/* 交换按钮 */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canSwap || quoteLoading || swapLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 px-6 rounded-xl transition disabled:cursor-not-allowed"
        >
          {!address
            ? '请先连接钱包'
            : isETHWETHPair()
            ? '不支持 ETH/WETH 直接交换'
            : !inputAmount || parseFloat(inputAmount) === 0
            ? '输入金额'
            : parseFloat(inputFormattedBalance) < parseFloat(inputAmount)
            ? '余额不足'
            : quoteLoading
            ? '计算中...'
            : approving
            ? '授权中...'
            : swapping
            ? '交换中...'
            : '交换'}
        </button>
      </div>

      {/* 市场概览 */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">热门代币</h3>
        <div className="grid grid-cols-2 gap-4">
          {tokens.slice(0, 4).map((token) => (
            <div
              key={token.symbol}
              className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800/70 transition cursor-pointer"
              onClick={() => {
                if (inputToken.address !== token.address) {
                  setOutputToken(token);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💎</span>
                <span className="text-sm font-medium text-white">
                  {token.symbol}
                </span>
              </div>
              <div className="text-xs text-slate-400">{token.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 确认弹窗 */}
      <SwapConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        inputToken={inputToken}
        outputToken={outputToken}
        inputAmount={inputAmount}
        outputAmount={outputAmount}
        minimumOutput={minimumOutput}
        priceImpact={priceImpact}
        executionPrice={executionPrice}
        slippage={slippage}
        loading={swapLoading}
      />
    </div>
  );
}
