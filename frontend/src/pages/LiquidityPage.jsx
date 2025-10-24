/**
 * 流动性管理页面 - 集成真实的区块链交互
 */

import { useState, useEffect } from 'react';
import { Settings, Plus, Minus, Info } from 'lucide-react';
import { useAccount, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// Hooks
import { useTokenBalance, useETHBalance } from '../hooks/useTokenBalance';
import {
  usePoolInfo,
  useUserLiquidity,
  useCalculateAddLiquidity,
} from '../hooks/usePoolInfo';
import { useLiquidity } from '../hooks/useLiquidity';

// Config & Utils
import { getTokensByChainId, isNativeToken } from '../config/tokens';
import { formatTokenAmount, getExplorerUrl } from '../utils/web3';
import { getAddressesByChainId } from '../contracts/addresses';
import BigNumber from 'bignumber.js';
import { checkUserLiquidity } from '../utils/checkLiquidity';

// Components
import AddLiquidityModal from '../components/AddLiquidityModal';
import RemoveLiquidityModal from '../components/RemoveLiquidityModal';

export default function LiquidityPage() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();

  // 获取代币列表
  const tokens = getTokensByChainId(chain?.id || 1);

  // Tab 状态
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'remove'

  // 代币选择
  const [tokenA, setTokenA] = useState(tokens[0]); // ETH
  const [tokenB, setTokenB] = useState(tokens[2] || tokens[1]); // USDT

  // 添加流动性的输入
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  // 移除流动性的百分比
  const [removePercent, setRemovePercent] = useState(25);

  // 滑点设置
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // 确认弹窗
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // 查询余额
  const { formattedBalance: balanceA, refetch: refetchBalanceA } =
    isNativeToken(tokenA.address)
      ? useETHBalance()
      : useTokenBalance(tokenA.address);

  const { formattedBalance: balanceB, refetch: refetchBalanceB } =
    isNativeToken(tokenB.address)
      ? useETHBalance()
      : useTokenBalance(tokenB.address);

  // 查询池子信息
  const {
    reserve0,
    reserve1,
    totalSupply,
    loading: poolLoading,
    error: poolError,
    refetch: refetchPoolInfo,
  } = usePoolInfo(tokenA.address, tokenB.address, tokenA.decimals, tokenB.decimals);

  // 查询用户流动性
  const {
    lpBalance,
    formattedLPBalance,
    sharePercent,
    formattedTokenAAmount,
    formattedTokenBAmount,
    loading: userLiquidityLoading,
  } = useUserLiquidity(
    tokenA.address,
    tokenB.address,
    tokenA.decimals,
    tokenB.decimals
  );

  // 计算添加流动性
  const {
    amountB: calculatedAmountB,
    sharePercent: addSharePercent,
    lpTokens,
    loading: calculationLoading,
  } = useCalculateAddLiquidity(
    tokenA.address,
    tokenB.address,
    amountA,
    tokenA.decimals,
    tokenB.decimals
  );

  // 流动性操作
  const {
    addLiquiditySmart,
    removeLiquiditySmart,
    loading: liquidityLoading,
    approving,
    adding,
    removing,
  } = useLiquidity();

  // 当计算结果变化时，更新 amountB
  useEffect(() => {
    if (calculatedAmountB && parseFloat(calculatedAmountB) > 0) {
      setAmountB(calculatedAmountB);
    }
  }, [calculatedAmountB]);

  // 是否为新池子
  const isNewPool =
    reserve0 === '0' || reserve1 === '0' || !reserve0 || !reserve1;

  // 处理代币交换
  const handleSwapTokens = () => {
    const temp = tokenA;
    setTokenA(tokenB);
    setTokenB(temp);
    setAmountA('');
    setAmountB('');
  };

  // 快速设置 amountA
  const setMaxAmountA = () => {
    if (balanceA) {
      if (isNativeToken(tokenA.address)) {
        const maxAmount = Math.max(0, parseFloat(balanceA) - 0.01);
        setAmountA(maxAmount.toString());
      } else {
        setAmountA(balanceA);
      }
    }
  };

  // 处理添加流动性确认
  const handleAddConfirm = async () => {
    if (!address) {
      toast.error('请先连接钱包');
      return;
    }

    const toastId = toast.loading('准备添加流动性...');

    try {
      await addLiquiditySmart({
        tokenA: tokenA.address,
        tokenB: tokenB.address,
        amountA,
        amountB,
        decimalsA: tokenA.decimals,
        decimalsB: tokenB.decimals,
        slippage,
        onSuccess: ({ hash }) => {
          toast.success(
            <div className="flex flex-col gap-1">
              <div className="font-semibold">流动性添加成功！</div>
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

          setShowAddConfirm(false);
          setAmountA('');
          setAmountB('');

          // 刷新余额和流动性信息
          refetchBalanceA();
          refetchBalanceB();

          // 等待区块确认后刷新池子信息
          setTimeout(() => {
            refetchPoolInfo();
          }, 2000);
        },
        onError: (error) => {
          toast.error(error, { id: toastId });
          setShowAddConfirm(false);
        },
      });
    } catch (error) {
      console.error('Add liquidity failed:', error);
    }
  };

  // 计算移除流动性的数量
  const removeLPAmount = new BigNumber(lpBalance || 0)
    .multipliedBy(removePercent)
    .div(100)
    .toFixed(0);

  const removeAmountA = new BigNumber(formattedTokenAAmount || 0)
    .multipliedBy(removePercent)
    .div(100)
    .toFixed(6);

  const removeAmountB = new BigNumber(formattedTokenBAmount || 0)
    .multipliedBy(removePercent)
    .div(100)
    .toFixed(6);

  // 处理移除流动性确认
  const handleRemoveConfirm = async () => {
    if (!address) {
      toast.error('请先连接钱包');
      return;
    }

    const toastId = toast.loading('准备移除流动性...');

    try {
      await removeLiquiditySmart({
        tokenA: tokenA.address,
        tokenB: tokenB.address,
        liquidity: formatTokenAmount(removeLPAmount, 18, 18), // 保持精度
        amountAMin: removeAmountA,
        amountBMin: removeAmountB,
        decimalsA: tokenA.decimals,
        decimalsB: tokenB.decimals,
        slippage,
        onSuccess: ({ hash }) => {
          toast.success(
            <div className="flex flex-col gap-1">
              <div className="font-semibold">流动性移除成功！</div>
              <a
                href={getExplorerUrl(chain.id, hash, 'tx')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                查易详情 →
              </a>
            </div>,
            { id: toastId, duration: 6000 }
          );

          setShowRemoveConfirm(false);
          setRemovePercent(25);

          // 刷新余额和流动性信息
          refetchBalanceA();
          refetchBalanceB();

          // 等待区块确认后刷新池子信息
          setTimeout(() => {
            refetchPoolInfo();
          }, 2000);
        },
        onError: (error) => {
          toast.error(error, { id: toastId });
          setShowRemoveConfirm(false);
        },
      });
    } catch (error) {
      console.error('Remove liquidity failed:', error);
    }
  };

  // 检查是否可以添加流动性
  const canAddLiquidity =
    address &&
    amountA &&
    parseFloat(amountA) > 0 &&
    amountB &&
    parseFloat(amountB) > 0 &&
    parseFloat(balanceA || 0) >= parseFloat(amountA) &&
    parseFloat(balanceB || 0) >= parseFloat(amountB);

  // 检查是否可以移除流动性
  const canRemoveLiquidity =
    address && lpBalance && lpBalance !== '0' && removePercent > 0;

  // 调试函数：手动检查流动性
  const handleDebugLiquidity = async () => {
    if (!address || !publicClient) {
      toast.error('请先连接钱包');
      return;
    }

    console.log('=== 手动检查流动性 ===');

    const chainId = publicClient.chain.id;
    const addresses = getAddressesByChainId(chainId);
    const provider = new ethers.BrowserProvider(publicClient.transport, {
      chainId: publicClient.chain.id,
      name: publicClient.chain.name,
    });

    // 将 ETH 零地址替换为 WETH
    const actualTokenA = isNativeToken(tokenA.address)
      ? addresses.WETH
      : tokenA.address;
    const actualTokenB = isNativeToken(tokenB.address)
      ? addresses.WETH
      : tokenB.address;

    await checkUserLiquidity(
      provider,
      addresses.FACTORY,
      actualTokenA,
      actualTokenB,
      address
    );

    toast.success('检查完成，请查看控制台输出');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">流动性管理</h1>
        <p className="text-slate-400">提供流动性并赚取交易手续费</p>
        {/* 调试按钮 */}
        <button
          onClick={handleDebugLiquidity}
          className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition"
        >
          🔍 检查我的流动性（调试）
        </button>
      </div>

      {/* 主卡片 */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        {/* Tab 切换和设置 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('add')}
              className={`px-6 py-2 rounded-xl font-medium transition ${
                activeTab === 'add'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-1" />
              添加流动性
            </button>
            <button
              onClick={() => setActiveTab('remove')}
              className={`px-6 py-2 rounded-xl font-medium transition ${
                activeTab === 'remove'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Minus className="w-4 h-4 inline mr-1" />
              移除流动性
            </button>
          </div>
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
          </div>
        )}

        {/* 添加流动性界面 */}
        {activeTab === 'add' && (
          <div className="space-y-4">
            {/* 代币对选择 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  代币 A
                </label>
                <select
                  value={tokenA.address}
                  onChange={(e) => {
                    const token = tokens.find((t) => t.address === e.target.value);
                    setTokenA(token);
                    setAmountA('');
                    setAmountB('');
                  }}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  代币 B
                </label>
                <select
                  value={tokenB.address}
                  onChange={(e) => {
                    const token = tokens.find((t) => t.address === e.target.value);
                    setTokenB(token);
                    setAmountA('');
                    setAmountB('');
                  }}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 金额输入 - Token A */}
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">数量</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">
                    余额: {balanceA || '0'} {tokenA.symbol}
                  </span>
                  <button
                    onClick={setMaxAmountA}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    最大
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none"
                disabled={!address}
              />
              <div className="text-xs text-slate-500 mt-1">{tokenA.name}</div>
            </div>

            {/* 加号 */}
            <div className="flex justify-center">
              <div className="p-2 bg-slate-800 rounded-full">
                <Plus className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* 金额输入 - Token B */}
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">数量</span>
                <span className="text-sm text-slate-400">
                  余额: {balanceB || '0'} {tokenB.symbol}
                </span>
              </div>
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder={isNewPool ? '0.0' : '自动计算...'}
                className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none"
                disabled={!address || !isNewPool}
              />
              <div className="text-xs text-slate-500 mt-1">{tokenB.name}</div>
            </div>

            {/* 池子信息 */}
            {amountA && amountB && !poolLoading && (
              <div className="bg-slate-800/30 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">
                    {isNewPool ? '新流动性池' : '池子信息'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">预计 LP Token</span>
                  <span className="text-white font-medium">
                    {isNewPool
                      ? (() => {
                          // 新池子计算 LP: sqrt(amountA * amountB) - 1000
                          try {
                            const MINIMUM_LIQUIDITY = '1000';
                            const amountAWei = new BigNumber(amountA).multipliedBy(
                              new BigNumber(10).pow(tokenA.decimals)
                            );
                            const amountBWei = new BigNumber(amountB).multipliedBy(
                              new BigNumber(10).pow(tokenB.decimals)
                            );
                            const liquidity = amountAWei
                              .multipliedBy(amountBWei)
                              .sqrt()
                              .minus(MINIMUM_LIQUIDITY);
                            return formatTokenAmount(liquidity.toFixed(0), 18, 6);
                          } catch {
                            return '0';
                          }
                        })()
                      : formatTokenAmount(lpTokens, 18, 6)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">池子份额</span>
                  <span className="text-white font-medium">
                    {isNewPool ? '100' : parseFloat(addSharePercent || 0).toFixed(4)}%
                  </span>
                </div>

                {/* 显示价格信息（包括新池子） */}
                {parseFloat(amountA) > 0 && parseFloat(amountB) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">
                      {isNewPool ? '初始价格' : '价格'}
                    </span>
                    <div className="text-right text-white font-medium">
                      <div>
                        1 {tokenA.symbol} ={' '}
                        {(parseFloat(amountB) / parseFloat(amountA)).toFixed(6)}{' '}
                        {tokenB.symbol}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 余额不足提示 */}
            {amountA &&
              parseFloat(amountA) > 0 &&
              balanceA &&
              parseFloat(balanceA) < parseFloat(amountA) && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                  {tokenA.symbol} 余额不足
                </div>
              )}

            {amountB &&
              parseFloat(amountB) > 0 &&
              balanceB &&
              parseFloat(balanceB) < parseFloat(amountB) && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                  {tokenB.symbol} 余额不足
                </div>
              )}

            {/* 添加按钮 */}
            <button
              onClick={() => setShowAddConfirm(true)}
              disabled={!canAddLiquidity || liquidityLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 px-6 rounded-xl transition disabled:cursor-not-allowed"
            >
              {!address
                ? '请先连接钱包'
                : !amountA || !amountB
                ? '输入数量'
                : parseFloat(balanceA || 0) < parseFloat(amountA)
                ? `${tokenA.symbol} 余额不足`
                : parseFloat(balanceB || 0) < parseFloat(amountB)
                ? `${tokenB.symbol} 余额不足`
                : approving
                ? '授权中...'
                : adding
                ? '添加中...'
                : '添加流动性'}
            </button>
          </div>
        )}

        {/* 移除流动性界面 */}
        {activeTab === 'remove' && (
          <div className="space-y-4">
            {/* 用户流动性信息 */}
            <div className="bg-slate-800/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">您的 LP Token</span>
                <span className="text-lg font-semibold text-white">
                  {formattedLPBalance || '0'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">池子份额</span>
                <span className="text-lg font-semibold text-white">
                  {parseFloat(sharePercent || 0).toFixed(4)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    持有 {tokenA.symbol}
                  </div>
                  <div className="text-white font-medium">
                    {formattedTokenAAmount || '0'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    持有 {tokenB.symbol}
                  </div>
                  <div className="text-white font-medium">
                    {formattedTokenBAmount || '0'}
                  </div>
                </div>
              </div>
            </div>

            {/* 移除百分比选择 */}
            <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
              <div className="text-sm text-slate-400 mb-4">移除数量</div>

              {/* 百分比按钮 */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setRemovePercent(percent)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                      removePercent === percent
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              {/* 滑块 */}
              <input
                type="range"
                min="0"
                max="100"
                value={removePercent}
                onChange={(e) => setRemovePercent(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-600"
              />

              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0%</span>
                <span className="text-white font-medium">{removePercent}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* 将收到的代币 */}
            {removePercent > 0 && (
              <div className="bg-slate-800/30 rounded-xl p-4 space-y-3">
                <div className="text-sm text-slate-400 mb-2">将收到</div>

                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tokenA.icon || '💎'}</span>
                    <span className="text-white font-medium">
                      {tokenA.symbol}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {removeAmountA}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tokenB.icon || '💰'}</span>
                    <span className="text-white font-medium">
                      {tokenB.symbol}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {removeAmountB}
                  </span>
                </div>
              </div>
            )}

            {/* 移除按钮 */}
            <button
              onClick={() => setShowRemoveConfirm(true)}
              disabled={!canRemoveLiquidity || liquidityLoading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 px-6 rounded-xl transition disabled:cursor-not-allowed"
            >
              {!address
                ? '请先连接钱包'
                : !lpBalance || lpBalance === '0'
                ? '无可用流动性'
                : removing
                ? '移除中...'
                : '移除流动性'}
            </button>
          </div>
        )}
      </div>

      {/* 添加流动性确认弹窗 */}
      <AddLiquidityModal
        isOpen={showAddConfirm}
        onClose={() => setShowAddConfirm(false)}
        onConfirm={handleAddConfirm}
        tokenA={tokenA}
        tokenB={tokenB}
        amountA={amountA}
        amountB={amountB}
        sharePercent={addSharePercent}
        lpTokens={lpTokens}
        slippage={slippage}
        loading={liquidityLoading}
        isNewPool={isNewPool}
      />

      {/* 移除流动性确认弹窗 */}
      <RemoveLiquidityModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemoveConfirm}
        tokenA={tokenA}
        tokenB={tokenB}
        lpAmount={formatTokenAmount(removeLPAmount, 18, 6)}
        amountA={removeAmountA}
        amountB={removeAmountB}
        sharePercent={(removePercent * parseFloat(sharePercent || 0)) / 100}
        slippage={slippage}
        loading={liquidityLoading}
      />
    </div>
  );
}
