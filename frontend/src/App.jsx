import React, { useState } from 'react';
import CryptoSwapDEX from './pages/CryptoSwapDEX'
import ConnectWalletButton from './pages/ConnectWalletButton';
import { ethers } from 'ethers';
import BackgroundStars from './pages/BackgroundStars';
import NotificationContainer from './pages/NotificationContainer';
import SwapPage from './pages/SwapPage';
import LiquidityPage from './pages/LiquidityPage';
import MiningPage from './pages/MiningPage';
import RewardsPage from './pages/RewardsPage';

/* export default function App() {
  return (
    <CryptoSwapDEX />
  )
} */

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
  const [currentRoute, setCurrentRoute] = useState('/swap');
  const [walletConnected, setWalletConnected] = useState(true);
  const [wallet, setWallet] = useState({ connected: false, address: null, chainId: null });
  const [statusMsg, setStatusMsg] = useState("未连接");
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
      rewards: 123.45,
      apy: 13.7
    });
  const handleConnect = async ({ address, provider, chainId }) => {
    console.log('handleConnect_: ', { address, provider, chainId })
    // 一键登录：签名 nonce -> 提交 verify -> 获得 JWT
    if (address) {
      // 调用后端接口获取 nonce
      try {
        // await readExample();
        const res = await fetchNonce(address);
        const nonce = res.data.nonce;
        // 使用 ethers.providers 对 nonce 消息进行签名
        const eprovider = new ethers.BrowserProvider(window.ethereum);
        await eprovider.send('eth_requestAccounts', [])
        const signer = await eprovider.getSigner();
        const signature = await signer.signMessage(nonce);
        //
        const vr = await verifySignature({ nonce, address, signature });
        console.log('vr: ', vr)
        if (vr.msg !== "OK") throw new Error("未获得 token");
        setWallet({ connected: true, address, chainId });
        setStatusMsg(`已连接：${address.slice(0, 6)}…${address.slice(-4)} @ ${chainId}`);
        // TODO: 在此触发你的首页数据加载，如余额、池子列表等
        setWalletConnected(true);
        showNotification('钱包连接成功！', 'success');
      } catch (e) {
        console.error("失败: ", e);
        showNotification(`连接失败: ${e}`, 'error')
      }
    } else {
      setWalletConnected(false);
    }
  };

  // 调用后端接口获取 nonce 的方法
  async function fetchNonce(address) {
    try {
      const url = `https://8bffa73e18a7.ngrok-free.app/api/v1/auth/nonce/?address=${address}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error("请求失败: " + res.status);
      const data = await res.json();
      console.log("Nonce 响应:", data);
      return data;
    } catch (e) {
      console.error("获取 nonce 出错:", e);
      throw e;
    }
  }

  // 调用后端「签名验证」接口，换取 JWT
  async function verifySignature({ nonce, address, signature }) {
    try {
      const res = await fetch("https://8bffa73e18a7.ngrok-free.app/api/v1/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce, address, signature }),
      });
      if (!res.ok) throw new Error(`验证失败: ${res.status}`);
      const data = await res.json();
      console.log("Verify 响应:", data);
      return data; // 期望含 { token: "JWT..." }
    } catch (e) {
      console.error("签名验证出错:", e);
      throw e;
    }
  }

  const handleDisconnect = () => {
    setWallet({ connected: false, address: null, chainId: null });
    setStatusMsg("已断开连接");
    // TODO: 清空/重置首页数据
    setWalletConnected(false);
  };
  const handleAccountsChanged = ({ address }) => {
    if (!address) return handleDisconnect();
    setWallet((w) => ({ ...w, address, connected: true }));
    setStatusMsg(`账户切换：${address.slice(0, 6)}…${address.slice(-4)}`);
    // TODO: 账户切换后的数据刷新
  };

  const handleChainChanged = ({ chainId }) => {
    setWallet((w) => ({ ...w, chainId }));
    setStatusMsg(`网络切换：${chainId}`);
    // TODO: 网络切换后的数据刷新
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
            <ConnectWalletButton isConnected={walletConnected}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onAccountsChanged={handleAccountsChanged}
              onChainChanged={handleChainChanged}
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 flex-1 overflow-auto pt-20">
        <main className='relative z-10 min-h-96'>
          <Router cRoute={currentRoute}>
            <Route path="/swap">
              <SwapPage walletConnected={walletConnected} />
            </Route>
            <Route path="/liquidity">
              <LiquidityPage walletConnected={walletConnected} stats={stats} />
            </Route>
            <Route path="/mining">
              <MiningPage walletConnected={walletConnected} stats={stats} />
            </Route>
            <Route path="/rewards">
              <RewardsPage walletConnected={walletConnected} />
            </Route>
          </Router>
        </main>
      </div>

    </div>
  )
}
