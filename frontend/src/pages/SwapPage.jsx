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

  // 调试日志
  useEffect(() => {
    console.log('🔍 代币列表:', tokens);
    console.log('🔍 链ID:', chain?.id);
  }, [tokens, chain?.id]);

  // 代币选择 - 使用 lazy initialization 避免在 tokens 更新时出现问题
  const [inputToken, setInputToken] = useState(() => tokens[0]); // ETH
  const [outputToken, setOutputToken] = useState(() => tokens[2] || tokens[1]); // USDT

  // 当链切换时更新代币
  useEffect(() => {
    if (chain?.id) {
      const newTokens = getTokensByChainId(chain.id);
      if (newTokens.length > 0) {
        // 检查当前选中的代币是否在新链的列表中
        const inputExists = newTokens.find(t => t.address === inputToken?.address);
        const outputExists = newTokens.find(t => t.address === outputToken?.address);

        if (!inputExists) {
          setInputToken(newTokens[0]);
        }
        if (!outputExists) {
          setOutputToken(newTokens[2] || newTokens[1]);
        }
      }
    }
  }, [chain?.id]);

  // 输入金额
  const [inputAmount, setInputAmount] = useState('');

  // 滑点设置
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // 确认弹窗
  const [showConfirm, setShowConfirm] = useState(false);

  // 查询 ETH 和代币余额 - 必须无条件调用所有 Hooks
  const ethBalance = useETHBalance();
  const inputTokenBalance = useTokenBalance(inputToken?.address);
  const outputTokenBalance = useTokenBalance(outputToken?.address);

  // 根据代币类型选择使用哪个余额
  const {
    balance: inputBalance,
    formattedBalance: inputFormattedBalance,
    refetch: refetchInputBalance,
  } = isNativeToken(inputToken?.address) ? ethBalance : inputTokenBalance;

  const { refetch: refetchOutputBalance } = isNativeToken(outputToken?.address)
    ? ethBalance
    : outputTokenBalance;

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
    inputToken?.address,
    outputToken?.address,
    inputAmount,
    inputToken?.decimals,
    outputToken?.decimals,
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
    if (inputFormattedBalance && inputToken) {
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

  // 如果代币未加载完成，显示加载状态
  if (!inputToken || !outputToken || tokens.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center text-slate-400">加载代币列表中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      {/* 交换卡片 */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl animate-scale-in">
        {/* 标题和设置 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-bold neon-text-enhanced">交换</div>
          <span className="text-sm text-slate-300 rounded-lg px-2 py-1 bg-slate-700/50 hover:bg-slate-700/70 transition-all">最优路径</span>
        </div>

        {/* 从 Token */}
        <div className="relative mb-5">
          <div className="bg-slate-800/70 rounded-xl p-5 border border-slate-700/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base text-slate-400">从</span>
              <span className="text-base text-slate-400">
                余额: {inputFormattedBalance || '0'} {inputToken.symbol}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-4 py-3">
                <img
                  src={inputToken.logoURI}
                  alt={inputToken.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <select
                  value={inputToken.address}
                  onChange={(e) => {
                    console.log('🔄 选择输入代币:', e.target.value);
                    const token = tokens.find((t) => t.address === e.target.value);
                    console.log('🔄 找到的代币:', token);
                    if (token) {
                      setInputToken(token);
                      setInputAmount('');
                    }
                  }}
                  className="bg-transparent text-white text-base font-medium focus:outline-none cursor-pointer [&>option]:bg-slate-700 [&>option]:text-white [&>option]:py-2"
                >
                  {tokens.map((token) => (
                    <option key={token.address} value={token.address} className="bg-slate-700 text-white py-2">
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-gray-700 py-1 px-2 rounded-xl text-white text-right text-xl font-semibold focus:outline-none placeholder:text-slate-500"
                disabled={!address}
              />
            </div>
          </div>
        </div>

        {/* 交换按钮 */}
        <div className="flex justify-center mb-5 relative">
          <button
            onClick={handleSwapTokens}
            className="bg-slate-700/50 hover:bg-slate-600/50 p-4 rounded-full border border-slate-600/30 transition-all hover:scale-110"
          >
            <ArrowUpDown className="w-6 h-6 text-slate-300" />
          </button>
        </div>

        {/* 到 Token */}
        <div className="relative mb-7">
          <div className="bg-slate-800/70 rounded-xl p-5 border border-slate-700/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base text-slate-400">到</span>
              <span className="text-base text-slate-400">
                {outputToken.symbol}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-4 py-3">
                <img
                  src={outputToken.logoURI}
                  alt={outputToken.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <select
                  value={outputToken.address}
                  onChange={(e) => {
                    console.log('🔄 选择输出代币:', e.target.value);
                    const token = tokens.find((t) => t.address === e.target.value);
                    console.log('🔄 找到的代币:', token);
                    if (token) {
                      setOutputToken(token);
                    }
                  }}
                  className="bg-transparent text-white text-base font-medium focus:outline-none cursor-pointer [&>option]:bg-slate-700 [&>option]:text-white [&>option]:py-2"
                >
                  {tokens.map((token) => (
                    <option key={token.address} value={token.address} className="bg-slate-700 text-white py-2">
                      {token.symbol}
                      </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                value={formattedOutputAmount}
                readOnly
                placeholder="0.0"
                className="flex-1 bg-gray-700 py-1 px-2 rounded-xl text-white text-right text-xl font-semibold focus:outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* 交换信息 */}
        {inputAmount && outputAmount !== '0' && !quoteError && (
          <div className="bg-slate-800/30 rounded-xl p-5 mb-6 border border-slate-700/20">
            <div className="flex items-center justify-between text-base mb-3">
              <span className="text-slate-400">汇率</span>
              <span className="text-white">
                1 {inputToken.symbol} ≈ {parseFloat(executionPrice).toFixed(6)} {outputToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-base mb-3">
              <span className="text-slate-400">滑点</span>
              <span className="text-white">{slippage}%</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-slate-400">价格影响</span>
              <span className={priceImpactWarning ? 'text-yellow-400' : 'text-green-400'}>
                {priceImpact}%
              </span>
            </div>
          </div>
        )}

        {/* ETH <-> WETH 提示 */}
        {isETHWETHPair() && (
          <div className="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-base">
            ETH 和 WETH 是 1:1 包装关系，请使用 Wrap/Unwrap 功能
          </div>
        )}

        {/* 错误提示 */}
        {quoteError && inputAmount && !isETHWETHPair() && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-base">
            {parseError({ message: quoteError })}
          </div>
        )}

        {/* 余额不足提示 */}
        {inputAmount &&
          parseFloat(inputAmount) > 0 &&
          inputFormattedBalance &&
          parseFloat(inputFormattedBalance) < parseFloat(inputAmount) && (
            <div className="mb-5 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-base">
              余额不足
            </div>
          )}

        {/* 交换按钮 */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canSwap || quoteLoading || swapLoading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70"
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

      {/* 市场趋势卡片 */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl mt-8 animate-scale-in">
        <h3 className="text-xl font-semibold neon-text-enhanced mb-6">市场概览</h3>
        <div className="grid grid-cols-2 gap-5">
          {tokens.slice(0, 4).map((token, index) => (
            <div
              key={token.symbol}
              className="bg-slate-800/50 rounded-lg p-4 duration-300 card-cyber transition-all animate-float-slow cursor-pointer"
              style={{ animationDelay: `${0.5 * index}s` }}
              onClick={() => {
                if (inputToken.address !== token.address) {
                  setOutputToken(token);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💎</span>
                <span className="text-base font-medium text-white">{token.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{token.name}</span>
                <span className="text-sm font-semibold text-green-400">+2.34%</span>
              </div>
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
