import { useState } from "react"
import StatCard from "./StatCard"
import GlowCard from "./GlowCard"
import PoolCard from "./PoolCard";

export default function LiquidityPage({ walletConnected, stats }) {

    const [currentPool, setCurrentPool] = useState('allPool');
    const togglePoolClick = (cPool) => {
        setCurrentPool(cPool);
    }
    const [poolDatalist] = useState([
        { pair: "ETH/USDC", tvl: "$5.8M", vol: "$1.2M", fee: "0.05%", apy: "24.5%", badge: '🔷💵' },
        { pair: "WBTC/ETH", tvl: "$3.2M", vol: "$890K", fee: "0%", apy: "18.7%", badge: '₿🔷' },
        { pair: "UNI/USDC", tvl: "$1.8M", vol: "$450K", fee: "0%", apy: "12.1%", badge: '🦄💵' },
        { pair: "LINK/ETH", tvl: "$980K", vol: "$230K", fee: "0%", apy: "20.1%", badge: '🔗🔷' }
    ])
    const setConnectWallet = ()=>{}

    return (
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
                </div>
            </div>

            {!walletConnected ? <EmptyState connectWallet={setConnectWallet}
                icon="💧"
                title={currentPool === "allPool" ? "连接钱包开始提供流动性" : "连接钱包查看您的流动性"}
                description={currentPool === "allPool" ? "连接您的钱包以添加流动性并赚取手续费" : "连接钱包以查看和管理您的流动性池"}
            /> : (<div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">
                {poolDatalist.map(item => <PoolCard key={item.pair} pair={item.pair} tvl={item.tvl} vol={item.vol} fee={item.fee} apy={item.apy} badge={item.badge} />)}
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
    )
}