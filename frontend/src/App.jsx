import React, { useState } from 'react';
import ConnectWalletButton from './pages/ConnectWalletButton';
import BackgroundStars from './pages/BackgroundStars';
import NotificationContainer from './pages/NotificationContainer';
import SwapPage from './pages/SwapPage';
import LiquidityPage from './pages/LiquidityPage';
import MiningPage from './pages/MiningPage';
import RewardsPage from './pages/RewardsPage';
import { useWallet } from './pages/useWallet';
// 路由组件
const Router = ({ children, cRoute }) => {
  return React.Children.map(children, child => {
    if (child.props.path === cRoute) {
      return child;
    }
    return null;
  });
};

const Route = ({ path, children }) => {
  return <>{children}</>;
};

export default function App() {
  const { walletConnected, address, chainId } = useWallet();
  const [currentRoute, setCurrentRoute] = useState('/swap');
  const [notifications, setNotifications] = useState([]);
  // 显示通知
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };
  // 统计数据状态
  const [stats, setStats] = useState({
    liquidity: 2648.50,
    fees: 45.67,
    pools: 1,
    totalStaked: 3456.78,
    totalStaked: 123.45,
    activeStakes: 13.7
  });
  //获取用户的质押记录
  const loadRecords = async () => {
    if (!address || !chainId) return;
    const res = await fetch(`${VITE_BASEURL}/api/v1/stake/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAddress: address, chainId, page: 1, pageSize: 20 })
    });
    const json = await res.json();
    console.log('质押记录:', json.data.records);
  };
  // 获取用户的质押概览
  const loadOverview = async () => {
    if (!address || !chainId) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASEURL}/api/v1/stake/overview`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAddress: address, chainId }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { data } = await res.json();
      console.log('质押概览:', data);
      // 这里可以把 data 存到 state，例如 setOverview(data)
    } catch (e) {
      console.error('加载质押概览失败:', e);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-x-hidden">
      <BackgroundStars />
      <NotificationContainer notifications={notifications} />

      <header className="flex flex-col lg:flex-row justify-between items-center bg-black p-2 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center animate-pulse-glow">
            <span className="text-white font-bold animate-spin-slow">⚡</span>
          </div>
          <span className="text-xl font-bold neon-text-enhanced animate-bounce-slow">CryptoSwap</span>
        </div>
        <div className="flex bg-slate-800/80 backdrop-blur-lg border border-white/10 rounded-3xl p-1 mb-4 lg:mb-0">
          {[
            { key: '/swap', label: '交换', icon: '🔄' },
            { key: '/liquidity', label: '流动性', icon: '💧' },
            { key: '/mining', label: '质押', icon: '🔒' },
            { key: '/rewards', label: '空投', icon: '🎁' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setCurrentRoute(tab.key)}
              className={`px-2 py-1 rounded-2xl font-medium transition-all duration-200 flex items-center gap-2 ${currentRoute === tab.key
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
          <div className="flex items-center gap-4">
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 flex-1 overflow-auto pt-20">
        <main className='relative z-10 min-h-96'>
          <Router cRoute={currentRoute}>
            <Route path="/swap">
              <SwapPage />
            </Route>
            <Route path="/liquidity">
              <LiquidityPage stats={stats} />
            </Route>
            <Route path="/mining">
              <MiningPage stats={stats} />
            </Route>
            <Route path="/rewards">
              <RewardsPage />
            </Route>
          </Router>
        </main>
      </div>

    </div>
  )
}
