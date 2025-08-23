import React, { useState, useEffect } from 'react';
import BackgroundStars from './BackgroundStars';
import NotificationContainer from './NotificationContainer';
import StatCard from './StatCard';
import TokenInput from './TokenInput';
import EmptyState from './EmptyState';


const CryptoSwapDEX = () => {
  const [activeTab, setActiveTab] = useState('swap');
  const [walletConnected, setWalletConnected] = useState(false);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [isSwapping, setIsSwapping] = useState(false);
  const [notifications, setNotifications] = useState([]);

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


  // 代币项目组件
  const TokenItem = ({ symbol, price, change }) => (
    <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-500/50 transition-all duration-200 hover:-translate-y-1">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto mb-2"></div>
      <div className="font-semibold mb-1">{symbol}</div>
      <div className="text-green-400 text-sm mb-1">${price.toLocaleString()}</div>
      <div className="text-green-400 text-xs">+{change}%</div>
    </div>
  );

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-x-hidden">
      <BackgroundStars />
      <NotificationContainer notifications={notifications} />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* 头部导航 */}
        <header className="flex flex-col lg:flex-row justify-between items-center mb-8">
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
                className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-green-500/20 border border-green-500/50 rounded-2xl px-4 py-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Ethereum</span>
            </div>
            <button
              onClick={connectWallet}
              className={`font-semibold px-6 py-3 rounded-2xl transition-all duration-200 ${
                walletConnected
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:-translate-y-1'
              }`}
            >
              {walletConnected ? '0x1234...5678' : '连接钱包'}
            </button>
          </div>
        </header>

        {/* 交换界面 */}
        {activeTab === 'swap' && (
          <div className="space-y-8">
            {/* 标题区域 */}
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                交易
              </h1>
              <p className="text-gray-400 text-lg">提供流动性，赚取交易手续费</p>
            </div>

            {/* 统计数据 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="我的流动性"
                value={stats.liquidity}
                change="+5.2% 本周"
                gradient="from-cyan-400 to-blue-500"
              />
              <StatCard
                title="累计手续费"
                value={stats.fees}
                change="+$0.34 今日"
                gradient="from-green-400 to-emerald-500"
              />
              <StatCard
                title="活跃池子"
                value={`${stats.pools}`}
                change="共 4 个池子"
                gradient="from-purple-400 to-pink-500"
              />
            </div>

            {/* 交换面板 */}
            <div className="bg-slate-800/60 backdrop-blur-lg border border-white/10 rounded-3xl p-8 max-w-lg mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">兑换代币</h3>
                <button className="text-gray-400 hover:text-white transition-colors">
                  ⚙️ 高级设置
                </button>
              </div>

              <div className="text-right text-sm text-gray-400 mb-4">余额: 1.2345 ETH</div>

              <TokenInput
                label="从"
                value={fromAmount}
                onChange={setFromAmount}
                token={fromToken}
                onTokenClick={() => showNotification('代币选择弹窗', 'info')}
                balance="1.2345 ETH"
              />

              <div className="flex justify-center my-4">
                <button
                  onClick={swapTokens}
                  className="bg-slate-800/80 border-2 border-white/10 rounded-full w-12 h-12 text-white text-xl hover:border-blue-500/50 transition-all duration-200 hover:rotate-180"
                >
                  ⇅
                </button>
              </div>

              <TokenInput
                label="到"
                value={toAmount}
                onChange={() => {}}
                token={toToken}
                onTokenClick={() => showNotification('代币选择弹窗', 'info')}
                balance="1250.00 USDC"
                disabled={true}
              />

              <button
                onClick={executeSwap}
                disabled={isSwapping}
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 rounded-2xl transition-all duration-200 hover:-translate-y-1 disabled:transform-none"
              >
                {isSwapping ? '兑换中...' : walletConnected ? '兑换代币' : '请先连接钱包'}
              </button>
            </div>

            {/* 热门代币 */}
            <div className="bg-slate-800/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">热门代币</h3>
                <span className="text-sm text-gray-400 bg-white/10 px-3 py-1 rounded-full">4 个代币</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(tokenPrices).map(([symbol, data]) => (
                  <TokenItem
                    key={symbol}
                    symbol={symbol}
                    price={data.price}
                    change={data.change}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 流动性界面 */}
        {activeTab === 'liquidity' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              流动性池
              </h1>
              <p className="text-gray-400 text-lg">提供流动性，赚取交易手续费</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="我的流动性" value={stats.liquidity} change="+5.2% 本周" />
              <StatCard title="累计手续费" value={stats.fees} change="+$0.34 今日" />
              <StatCard title="活跃池子" value={stats.pools} change="共 4 个池子" />
            </div>

            <div className="flex justify-center">
              <div className="bg-white/10 rounded-3xl p-1 flex">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-medium">
                  所有池子
                </button>
                <button className="px-6 py-3 text-gray-300 hover:text-white rounded-2xl font-medium">
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
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              质押挖矿
              </h1>
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
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                空投奖励
              </h1>
              <p className="text-gray-400 text-lg">参与活动，获得免费代币奖励</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="总奖励" value="750 CSWAP" change="+150 CSWAP 本周" gradient="from-cyan-400 to-blue-500" />
              <StatCard title="已奖励" value="320 CSWAP" change="价值 ~$320" gradient="from-green-400 to-emerald-500" />
              <StatCard title="待领取" value="400 CSWAP" change="价值 ~$400" gradient="from-purple-400 to-pink-500" />
            </div>

            <div className="flex justify-center mb-8">
              <div className="bg-white/10 rounded-3xl p-1 flex">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-medium">
                  空投活动
                </button>
                <button className="px-6 py-3 text-gray-300 hover:text-white rounded-2xl font-medium">
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
      </div>

      {/* 品牌标识 */}
      <div className="fixed bottom-5 right-5 text-xs text-gray-500 z-20">
        🚀 Made with Manus
      </div>
    </div>
  );
};

export default CryptoSwapDEX;