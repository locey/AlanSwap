import { useState,useEffect  } from "react"
import StatCard from "./StatCard"
import GlowCard from "./GlowCard"
import PoolCard from "./PoolCard";
import { useWallet } from "./useWallet";
import EmptyState from "./EmptyState";

export default function LiquidityPage({ stats }) {
    const { walletConnected } = useWallet();
    const [currentPool, setCurrentPool] = useState('allPool');
    const [poolList, setPoolList] = useState([]); // 后端返回的真实列表
    // const [loading, setLoading] = useState(true);

    const togglePoolClick = (cPool) => {
        setCurrentPool(cPool);
    }
    const [poolDatalist] = useState([
        { pair: "ETH/USDC", tvl: "$5.8M", vol: "$1.2M", fee: "$3,600", myshare: "0.05%", apy: "24.5%", badge: '🔷💵' },
        { pair: "WBTC/ETH", tvl: "$3.2M", vol: "$890K", fee: "$2,670", myshare: "0.05%", apy: "18.7%", badge: '₿🔷' },
        { pair: "UNI/USDC", tvl: "$1.8M", vol: "$450K", fee: "$1,350", myshare: "0.05%", apy: "12.1%", badge: '🦄💵' },
        { pair: "LINK/ETH", tvl: "$980K", vol: "$230K", fee: "$690", myshare: "0%", apy: "20.1%", badge: '🔗🔷' }
    ])

    // 调用后端接口获取 流动性池列表 的方法
    async function fetchLiQuidityList({ walletAddress, page, pageSize, poolType }) {
        try {
            const url = `https://8bffa73e18a7.ngrok-free.app/api/v1/liquidity/pools?walletAddress=${walletAddress}&page=${page}&pageSize=${pageSize}&poolType=${poolType}`;
            const res = await fetch(url, { method: "GET" });
            if (!res.ok) throw new Error("请求失败: " + res.status);
            const data = await res.json();
            return data;
        } catch (e) {
            console.error("获取 QuidityList 出错:", e);
            throw e;
        }
    }

    // 进入页面自动调用
    useEffect(() => {
        async function load() {
            // setLoading(true);
            try {
                const data = await fetchLiQuidityList({
                    walletAddress: walletConnected || "", // 未连接时传空串
                    page: 1,
                    pageSize: 20,
                    poolType: currentPool === "myPool" ? "my" : "all"
                });
                setPoolList(data?.list || []);
            } catch {
                setPoolList([]);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [walletConnected, currentPool]); // 钱包状态或 Tab 切换时重新拉取

    const setConnectWallet = () => console.log("TODO: connect wallet");

    // 骨架屏/加载态
    // if (loading) return <div className="text-center p-10">加载中…</div>;
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold neon-text mb-2">流动性池</h1>
                <p className="text-muted-foreground">提供流动性，赚取交易手续费</p>
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
                {poolDatalist.map(item => <PoolCard key={item.pair} pair={item.pair} tvl={item.tvl} vol={item.vol} fee={item.fee} myshare={item.myshare} apy={item.apy} badge={item.badge} />)}
            </div>)}
            {walletConnected && (<div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-indigo-400/20 hover:glow-purple transition-all duration-300">
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
            </div>)}
        </div>
    )
}