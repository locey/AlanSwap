import {
  ArrowUpDown,
  Trophy,
  Medal,
} from "lucide-react";
import React, { useState, useEffect } from 'react';
import BackgroundStars from './BackgroundStars';
import NotificationContainer from './NotificationContainer';
import StatCard from './StatCard';
import EmptyState from './EmptyState';
import PoolCard from './PoolCard';
import GlowCard from './GlowCard';
import StakeCard from './StakeCard';
import RewardCard from './RewardCard';
import ConnectWalletButton from "./ConnectWalletButton";
import { ethers } from "ethers";

const CryptoSwapDEX = () => {
  const [activeTab, setActiveTab] = useState('swap');
  const [walletConnected, setWalletConnected] = useState(true);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [isSwapping, setIsSwapping] = useState(false);
  const [notifications, setNotifications] = useState([]);

  //add swapSection--yy3
  const [wallet, setWallet] = useState({ connected: false, address: null, chainId: null });
  const [statusMsg, setStatusMsg] = useState("未连接");

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
        if (vr.msg !=="OK") throw new Error("未获得 token");
        setWallet({ connected: true, address, chainId });
        setStatusMsg(`已连接：${address.slice(0, 6)}…${address.slice(-4)} @ ${chainId}`);
        // TODO: 在此触发你的首页数据加载，如余额、池子列表等
        setWalletConnected(true);
        showNotification('钱包连接成功！', 'success');
      } catch (e) {
        console.error("失败: ", e);
        showNotification(`连接失败: ${e}` , 'error')
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
  // const [fromToken, setFromToken] = useState('ETH');
  // const [toToken, setToToken] = useState('USDC');
  // const [fromAmount, setFromAmount] = useState('');
  // const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1250.00);
  const [slippage, setSlippage] = useState('0.5');

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', balance: 12.345, icon: '🔹' },
    { symbol: 'WBTC', name: 'Bitcoin', balance: 0.5678, icon: '₿' },
    { symbol: 'USDC', name: 'USD Coin', balance: 1250.00, icon: '💵' },
    { symbol: 'USDT', name: 'Tether', balance: 500.00, icon: '💰' }
  ];

  const getTokenData = (symbol) => {
    return tokens.find(token => token.symbol === symbol);
  };

  const [poolDatalist] = useState([
    { pair:"ETH/USDC", tvl: "$5.8M", vol: "$1.2M", fee: "0.05%", apy: "24.5%", badge: '🔷💵' },
    { pair: "WBTC/ETH", tvl: "$3.2M", vol: "$890K", fee: "0%", apy: "18.7%", badge: '₿🔷' },
    { pair: "UNI/USDC", tvl: "$1.8M", vol: "$450K", fee: "0%", apy: "12.1%", badge: '🦄💵' },
    { pair: "LINK/ETH", tvl: "$980K", vol: "$230K", fee: "0%", apy: "20.1%", badge: '🔗🔷' }
  ])
  const [stakeDataList] = useState([
    { title: "ETH 质押池", token: "ETH", tvl: "$2.4M", days: "30天", apy: "12.5%", deposited: "1.2345 ETH", badge: '🔷' },
    { title: "USDC 稳定池", token: "USDC", tvl: "$5.8M", days: "7天", apy: "8.2%", badge: '💵' },
    { title: "UNI 治理代币池", token: "UNI", tvl: "$890K", days: "90天", apy: "18.7%", badge: '🦄' },
    { title: "LINK 预言机池", token: "LINK", tvl: "$1.2M", days: "60天", apy: "15.3%", badge: '🔗' }
  ])
  const [rewardDataList] = useState([
    { title: "CryptoSwap Genesis 空投", subtitle: "庆祝 CryptoSwap 主网上线，向早期用户空投治理代币", totalReward: "1000,000 CSWAP", reward: "250 CSWAP", totalheadCount: 12342, deadline: "2025-12-31", badge: '🚀',
      reuqireConList: [{id: 1, text: '完成至少 1 次交换', doneFlag: true}, {id: 2, text: '提供流动性超过 $100', doneFlag: true}, {id: 3, text: '邀请 3 个朋友', doneFlag: false}, {id:4, text: '持有 LP 代币 7 天'}]
    },
    { title: "流动性提供者奖励", subtitle: "奖励活跃的流动性提供者，促进协议发展", totalReward: "500,000 CSWAP", reward: "150 CSWAP", totalheadCount: 5643, deadline: "2024-11-30", badge: '💧',
      reuqireConList: [{id: 1, text: '提供流动性超过 $500', doneFlag: true }, {id: 2, text: '保持流动性 30 天', doneFlag: false }, {id: 3, text: '参与治理投票', doneFlag: false }, ]
    },
    { title: "社区建设者计划", subtitle: "奖励为社区做出贡献的用户", totalReward: "100,000 CSWAP", reward: "0 CSWAP", totalheadCount: 1342, deadline: "2025-01-15", badge: '🌟',
      reuqireConList: [{id: 1, text: '在社交媒体分享', doneFlag: true}, {id: 2, text: '参与社区讨论', doneFlag: false}, {id: 3, text: '提交改进建议', doneFlag: false}, ]
    },
    { title: "质押奖励计划", subtitle: "已完成的质押奖励活动", totalReward: "400,000 CSWAP", reward: "320 CSWAP", totalheadCount: 1292, deadline: "2024-09-30", badge: '🔒',
      reuqireConList: [{id: 1, text: '质押 CSWAP 代币', doneFlag: false}, {id: 2, text: '保持质押 60 天', doneFlag: false} ]
    }
  ])

  const [currentPool, setCurrentPool] = useState('allPool');
  const togglePoolClick = (cPool) => {
    setCurrentPool(cPool);
  }
  const [currentDropType, setCurrentDropType] = useState('airdrop');
  const toggleDropClick = (cType) => {
    setCurrentDropType(cType);
  }
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
    console.log({ wallet }, 999)
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
  const setConnectWallet = async () => {
    if (!walletConnected) {
      const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accs?.[0];
      if (!addr) throw new Error("未获取到账户");
      handleConnect(addr); // 复用父组件的连接处理
      // setWalletConnected(true);
      // showNotification('钱包连接成功！', 'success');
    } else {
      setWalletConnected(false);
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
      setConnectWallet();
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
            { key: 'mining', label: '质押', icon: '🔒' },
            { key: 'rewards', label: '空投', icon: '🎁' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-2 py-1 rounded-2xl font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === tab.key
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
          {/* <div className="flex items-center bg-green-500/20 border border-green-500/50 rounded-2xl px-2 py-1 text-sm">
            <div className="mt-2">连接状态: {statusMsg}</div>
          </div> */}
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
                  <span className="text-sm text-black rounded-lg px-1 bg-slate-700/50 hover:bg-slate-700/70 transition-all">最优路径</span>
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
                {fromAmount && (<div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700/20">
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
                </div>)}

                {/* 交换按钮 */}
                <button
                  disabled={!walletConnected || !fromAmount || parseFloat(fromAmount) === 0}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed"
                >
                  {!walletConnected ? '请先连接钱包' : (!fromAmount || parseFloat(fromAmount) === 0 ? '输入金额' : '交换')}
                </button>
              </div>

              {/* 市场趋势卡片 */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl mt-6 animate-scale-in">
                <h3 className="text-lg font-semibold text-white mb-4">市场概览</h3>
                <div className="grid grid-cols-2 gap-4">
                  {tokens.slice(0, 4).map((token, index) => (
                    <div key={token.symbol} className="bg-slate-800/50 rounded-lg p-3 duration-300 card-cyber transition-all animate-float-slow" style={{animationDelay: `${0.5*index}s`,}}>
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
                  <button className={`px-6 py-1 rounded-2xl font-medium hover:text-white ${currentPool === 'allPool' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''} `} onClick={() => togglePoolClick('allPool')}>
                    所有池子
                  </button>
                  <button className={`px-6 py-1 rounded-2xl font-medium hover:text-white ${currentPool === 'myPool' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''} `} onClick={() => togglePoolClick('myPool')}>我的池子</button>
                  {/* <button className="px-6 py-1 text-gray-300 hover:text-white rounded-2xl font-medium" onClick={() => togglePoolClick('mylPool')}>
                    我的池子
                  </button> */}
                </div>
              </div>

              {!walletConnected ? <EmptyState connectWallet={setConnectWallet}
                icon="💧"
                title={currentPool === "allPool" ? "连接钱包开始提供流动性" : "连接钱包查看您的流动性"}
                description={currentPool === "allPool" ? "连接您的钱包以添加流动性并赚取手续费" : "连接钱包以查看和管理您的流动性池"}
              /> : (<div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">
                { poolDatalist.map( item => <PoolCard key={item.pair} pair={item.pair} tvl={item.tvl} vol={item.vol} fee={item.fee} apy={item.apy} badge={item.badge} /> )}
              </div>)}
              {walletConnected && (<GlowCard>
                <h3 className="mt-2 ml-6">流动性统计</h3>
                <div className="p-5 grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-white/70 mb-2">收益分布</div>
                    <div className="space-y-2">
                      {[
                        { k: "ETH", v: "$2,890.50", c: "+2.45%" },
                        { k: "ETH/USDC", v: "$1.2M", c: "24h 交易量" },
                      ].map((i) => (
                        <div key={i.k} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <div className="text-white/70">{i.k}</div>
                          <div className="text-white/90">{i.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/70 mb-2">池子表现</div>
                    <div className="space-y-2">
                      {[
                        { k: "ETH", v: "1.2345 ETH" },
                        { k: "USDC", v: "1250.00 USDC" },
                        { k: "UNI", v: "45.67 UNI" },
                      ].map((i) => (
                        <div key={i.k} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <div className="text-white/70">{i.k} 池</div>
                          <div className="text-white/90">{i.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowCard>)}
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

              {!walletConnected ? <EmptyState connectWallet={setConnectWallet}
                icon="🔒"
                title="连接钱包开始质押"
                description="连接您的钱包以查看和管理质押"
              /> : (<div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">
                { stakeDataList.map( item => <StakeCard key={item.title} title={item.title} token={item.token} tvl={item.tvl} days={item.days} apy={item.apy} deposited={item.deposited} badge={item.badge} /> ) }
              </div>)}
              {walletConnected && (<GlowCard>
                <div className="p-5 grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-white/70 mb-2">收益分布</div>
                    <div className="space-y-2">
                      {[
                        { k: "ETH", v: "0.0234 ETH", c: "+12.5%" },
                        { k: "USDC", v: "12.45 USDC", c: "+3.2%" },
                        { k: "UNI", v: "2.34 UNI", c: "+18.7%" },
                      ].map((i) => (
                        <div key={i.k} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <div className="text-white/80 flex items-center gap-2">{i.k}</div>
                          <div className="text-white/90">{i.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/70 mb-2">限期对照</div>
                    <div className="space-y-2">
                      {[
                        { k: "ETH 池", v: "1.2345 ETH" },
                        { k: "USDC 池", v: "1250.00 USDC" },
                        { k: "UNI 池", v: "45.67 UNI" },
                      ].map((i) => (
                        <div key={i.k} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <div className="text-white/70">{i.k}</div>
                          <div className="text-white/90">{i.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlowCard>)}
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
                <StatCard title="已领取" value="320 CSWAP" change="价值 ~$320" gradient="from-green-400 to-emerald-500" />
                <StatCard title="待领取" value="400 CSWAP" change="价值 ~$400" gradient="from-purple-400 to-pink-500" />
              </div>

              <div className="flex justify-center mb-8">
                <div className="bg-white/10 rounded-3xl p-1 flex">
                  <button className={`px-6 py-1 rounded-2xl font-medium hover:text-white ${currentDropType === 'airdrop' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''} `} onClick={() => toggleDropClick('airdrop')}>
                    空投活动
                  </button>
                  <button className={`px-6 py-1 rounded-2xl font-medium hover:text-white ${currentDropType === 'dropTask' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''} `} onClick={() => toggleDropClick('dropTask')}>
                    任务中心
                  </button>
                </div>
              </div>

              {!walletConnected ? <EmptyState connectWallet={setConnectWallet}
                icon="🎁"
                title={currentDropType === 'airdrop' ? "连接钱包参与空投" : "连接钱包开始任务"}
                description={currentDropType === 'airdrop' ? "连接您的钱包以参与空投活动并领取奖励" : "连接钱包以完成任务并获得奖励"}
              /> : (<div className="grid lg:grid-cols-2 gap-6">
                { rewardDataList.map( item => <RewardCard key={item.title} title={item.title} subtitle={item.subtitle} totalReward={item.totalReward} reward={item.reward}
                  totalheadCount={item.totalheadCount} deadline={item.deadline} badge={item.badge} reuqireConList={item.reuqireConList} /> )}
              </div>)}
              {walletConnected && (<GlowCard>
                <div className="p-5">
                  <div className="text-black font-extrabold text-lg mb-3"><Trophy className="w-6 h-6 mr-1 inline-block" />空投排行榜</div>
                  <div className="divide-y divide-white/10 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          {/* <div className="text-3xl">🥇</div> */}
                          <Medal className="w-6 h-6 mr-1 text-yellow-500" />
                          <div className="flex flex-col">
                            <div className="font-semibold text-black">#{i}</div>
                            <div className='text-sm text-muted-foreground text-gray-500'>0x1234...5678</div>
                          </div>
                        </div>
                        <div className="font-semibold text-green-400">{[1250, 980, 750, 720, 650][i - 1]} CSWAP</div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlowCard>)}
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