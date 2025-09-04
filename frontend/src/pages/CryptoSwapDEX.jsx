import React, { useState, useEffect } from 'react';
import BackgroundStars from './BackgroundStars';
import NotificationContainer from './NotificationContainer';
import StatCard from './StatCard';
import EmptyState from './EmptyState';
import { ArrowUpDown, Settings, Info } from './Icons';


const CryptoSwapDEX = () => {
  const [activeTab, setActiveTab] = useState('swap');
  const [walletConnected, setWalletConnected] = useState(false);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [isSwapping, setIsSwapping] = useState(false);
  const [notifications, setNotifications] = useState([]);

  //add swapSection--yy3
  // const [fromToken, setFromToken] = useState('ETH');
  // const [toToken, setToToken] = useState('USDC');
  // const [fromAmount, setFromAmount] = useState('');
  // const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1250.00);
  const [slippage, setSlippage] = useState('0.5');

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', balance: 12.345, icon: '🔹' },
    { symbol: 'USDC', name: 'USD Coin', balance: 1250.00, icon: '💎' },
    { symbol: 'BTC', name: 'Bitcoin', balance: 0.5678, icon: '🟡' },
    { symbol: 'USDT', name: 'Tether', balance: 500.00, icon: '💚' }
  ];

  const getTokenData = (symbol) => {
    return tokens.find(token => token.symbol === symbol);
  };

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleFromAmountChange = (value) => {
    setFromAmount(value);
    if (value && !isNaN(value)) {
      const calculated = fromToken === 'ETH' ? 
        (parseFloat(value) * exchangeRate).toFixed(2) : 
        (parseFloat(value) / exchangeRate).toFixed(6);
      setToAmount(calculated);
    } else {
      setToAmount('');
    }
  };

  const handleMaxClick = () => {
    const tokenData = getTokenData(fromToken);
    if (tokenData) {
      const maxAmount = tokenData.balance.toString();
      setFromAmount(maxAmount);
      handleFromAmountChange(maxAmount);
    }
  };

  // 统计数据状态
  const [stats, setStats] = useState({
    liquidity: 2648.50,
    fees: 45.67,
    pools: 1,
    totalStaked: 3456.78,
    rewards: 123.45,
    apy: 13.7
  });

  // 代币价格数据
  const [tokenPrices, setTokenPrices] = useState({
    ETH: { price: 2845, change: 2.34 },
    WBTC: { price: 43200, change: 2.34 },
    USDC: { price: 1.00, change: 0.01 },
    USDT: { price: 1.00, change: 0.01 }
  });

  // 显示通知
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // 连接钱包
  const connectWallet = () => {
    if (!walletConnected) {
      setWalletConnected(true);
      showNotification('钱包连接成功！', 'success');
    }
  };

  // 交换代币
  const swapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    showNotification('代币已交换', 'info');
  };

  // 执行兑换
  const executeSwap = async () => {
    if (!walletConnected) {
      connectWallet();
      return;
    }
    
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      showNotification('请输入兑换数量', 'error');
      return;
    }

    setIsSwapping(true);
    
    setTimeout(() => {
      setIsSwapping(false);
      setFromAmount('');
      setToAmount('');
      showNotification('兑换成功完成！', 'success');
    }, 2000);
  };

  // 实时汇率计算
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const rate = fromToken === 'ETH' ? 2845.32 : 1 / 2845.32;
      const result = (parseFloat(fromAmount) * rate).toFixed(2);
      setToAmount(result);
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-x-hidden">
      <BackgroundStars />
      <NotificationContainer notifications={notifications} />
      
        {/* 头部导航 */}
        <header className="flex flex-col lg:flex-row justify-between items-center mb-4 bg-black p-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center animate-pulse-glow">
              <span className="text-white font-bold animate-spin-slow">⚡</span>
            </div>
            <span className="text-xl font-bold neon-text-enhanced animate-bounce-slow">CryptoSwap</span>
          </div>
          <div className="flex bg-slate-800/80 backdrop-blur-lg border border-white/10 rounded-3xl p-1 mb-4 lg:mb-0">
            {[
              { key: 'swap', label: '交换', icon: '🔄' },
              { key: 'liquidity', label: '流动性', icon: '💧' },
              { key: 'mining', label: '质押', icon: '📊' },
              { key: 'rewards', label: '空投', icon: '🎁' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2 py-1 rounded-2xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className='text-sm animate-bounce-slow'>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-green-500/20 border border-green-500/50 rounded-2xl px-2 py-1 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Ethereum</span>
            </div>
            <button
              onClick={connectWallet}
              className={`font-semibold px-2 py-1 rounded-2xl transition-all duration-200 ${
                walletConnected
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:-translate-y-1'
              }`}
            >
              {walletConnected ? '0x1234...5678' : '连接钱包'}
            </button>
          </div>
        </header>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">

        <main className='relative z-10'>
          {/* 交换界面 */}
          {activeTab === 'swap' && (
            <div className="w-full max-w-md mx-auto">
            {/* 交换卡片 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-scale-in">
              {/* 标题和设置 */}
              <div className="flex items-center justify-between mb-6">
                <div data-slot="card-title" className="text-xl font-bold neon-text-enhanced">交换</div>
                <button className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-all">
                  <Settings className="w-4 h-4 text-slate-300" />
                </button>
              </div>
      
              {/* 从 Token */}
              <div className="relative mb-4">
                <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">从</span>
                    <span className="text-sm text-slate-400">
                      余额: {getTokenData(fromToken)?.balance.toFixed(fromToken === 'ETH' ? 3 : 2)} {fromToken}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={fromToken}
                      onChange={(e) => setFromToken(e.target.value)}
                      className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {tokens.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.icon} {token.symbol}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-gray-700 py-1 rounded-xl text-white text-right text-xl font-semibold focus:outline-none"
                    />
                    {/* <button 
                      onClick={handleMaxClick}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium bg-cyan-400/10 px-2 py-1 rounded"
                    >MAX</button> */}
                  </div>
                </div>
              </div>
      
              {/* 交换按钮 */}
              <div className="flex justify-center mb-4 relative">
                <button
                  onClick={handleSwapTokens}
                  className="bg-slate-700/50 hover:bg-slate-600/50 p-3 rounded-full border border-slate-600/30 transition-all hover:scale-110"
                >
                  <ArrowUpDown className="w-5 h-5 text-slate-300" />
                </button>
              </div>
      
              {/* 到 Token */}
              <div className="relative mb-6">
                <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">到</span>
                    <span className="text-sm text-slate-400">
                      余额: {getTokenData(toToken)?.balance.toFixed(toToken === 'USDC' ? 2 : 6)} {toToken}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={toToken}
                      onChange={(e) => setToToken(e.target.value)}
                      className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {tokens.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.icon} {token.symbol}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={toAmount}
                      readOnly
                      placeholder="0.0"
                      className="flex-1 bg-gray-700 py-1 rounded-xl text-white text-right text-xl font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
      
              {/* 交换信息 */}
              <div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700/20">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">汇率</span>
                  <span className="text-white">1 {fromToken} ≈ {exchangeRate.toLocaleString()} {toToken}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">滑点</span>
                  <span className="text-white">{slippage}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">手续费</span>
                  <span className="text-white">~0.003 ETH</span>
                </div>
              </div>
      
              {/* 交换按钮 */}
              <button 
                disabled={!fromAmount || parseFloat(fromAmount) === 0}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed"
              >
                {!fromAmount || parseFloat(fromAmount) === 0 ? '请先连接钱包' : '确认交换'}
              </button>
      
              {/* 提示信息 */}
              <div className="flex items-center gap-2 mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-blue-300">
                  交换前请确认代币地址和数量，交易一旦确认无法撤销
                </p>
              </div>
            </div>
      
            {/* 市场趋势卡片 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl mt-6 animate-scale-in">
              <h3 className="text-lg font-semibold text-white mb-4">市场概览</h3>
              <div className="grid grid-cols-2 gap-4">
                {tokens.slice(0, 4).map((token, index) => (
                  <div key={token.symbol} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{token.icon}</span>
                      <span className="text-sm font-medium text-white">{token.symbol}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{token.name}</span>
                      <span className="text-sm font-semibold text-green-400">+2.34%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* 流动性界面 */}
          {activeTab === 'liquidity' && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold neon-text mb-2">流动性池</h1>
                <p className="text-gray-400 text-lg">提供流动性，赚取交易手续费</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="我的流动性" value={stats.liquidity} change="+5.2% 本周" />
                <StatCard title="累计手续费" value={stats.fees} change="+$0.34 今日" />
                <StatCard title="活跃池子" value={stats.pools} change="共 4 个池子" />
              </div>

              <div className="flex justify-center">
                <div className="bg-white/10 rounded-3xl p-1 flex">
                  <button className="px-6 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-medium">
                    所有池子
                  </button>
                  <button className="px-6 py-1 text-gray-300 hover:text-white rounded-2xl font-medium">
                    我的池子
                  </button>
                </div>
              </div>

              <EmptyState connectWallet={connectWallet}
                icon="💧"
                title="连接钱包开始提供流动性"
                description="连接您的钱包以添加流动性并赚取手续费"
              />
            </div>
          )}

          {/* 质押界面 */}
          {activeTab === 'mining' && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold neon-text mb-2">质押挖矿</h1>
                <p className="text-gray-400 text-lg">质押您的代币，获得丰厚奖励</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="总质押价值" value={stats.totalStaked} change="+12.5% 本月" />
                <StatCard title="累计奖励" value={stats.rewards} change="+$5.67 本日" />
                <StatCard title="平均APY" value={`${stats.apy}%`} change="年化收益" />
              </div>

              <EmptyState connectWallet={connectWallet}
                icon="🔒"
                title="连接钱包开始质押"
                description="连接您的钱包以查看和管理质押"
              />
            </div>
          )}

          {/* 空投界面 */}
          {activeTab === 'rewards' && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold neon-text mb-2">空投奖励</h1>
                <p className="text-gray-400 text-lg">参与活动，获得免费代币奖励</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="总奖励" value="750 CSWAP" change="+150 CSWAP 本周" gradient="from-cyan-400 to-blue-500" />
                <StatCard title="已奖励" value="320 CSWAP" change="价值 ~$320" gradient="from-green-400 to-emerald-500" />
                <StatCard title="待领取" value="400 CSWAP" change="价值 ~$400" gradient="from-purple-400 to-pink-500" />
              </div>

              <div className="flex justify-center mb-8">
                <div className="bg-white/10 rounded-3xl p-1 flex">
                  <button className="px-6 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-medium">
                    空投活动
                  </button>
                  <button className="px-6 py-1 text-gray-300 hover:text-white rounded-2xl font-medium">
                    任务中心
                  </button>
                </div>
              </div>

              <EmptyState connectWallet={connectWallet}
                icon="🎁"
                title="连接钱包参与空投"
                description="连接您的钱包以参与空投活动并领取奖励"
              />
            </div>
          )}

        </main>
      </div>

      {/* 品牌标识 */}
      <div className="fixed bottom-5 right-5 text-xs text-gray-500 z-20">
        🚀 Made with Manus
      </div>
    </div>
  );
};

export default CryptoSwapDEX;