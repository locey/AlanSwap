import { useState } from "react"
import EmptyState from "./EmptyState"
import StatCard from "./StatCard"
import GlowCard from "./GlowCard"
import RewardCard from "./RewardCard"
import { Medal, Trophy } from "lucide-react"

export default function RewardsPage({ walletConnected }) {
    const setConnectWallet = () => { }
    const [currentDropType, setCurrentDropType] = useState('airdrop');
    const toggleDropClick = (cType) => {
        setCurrentDropType(cType);
    }
    const [rewardDataList] = useState([
        {
            title: "CryptoSwap Genesis 空投", subtitle: "庆祝 CryptoSwap 主网上线，向早期用户空投治理代币", totalReward: "1000,000 CSWAP", reward: "250 CSWAP", totalheadCount: 12342, deadline: "2025-12-31", badge: '🚀',
            reuqireConList: [{ id: 1, text: '完成至少 1 次交换', doneFlag: true }, { id: 2, text: '提供流动性超过 $100', doneFlag: true }, { id: 3, text: '邀请 3 个朋友', doneFlag: false }, { id: 4, text: '持有 LP 代币 7 天' }]
        },
        {
            title: "流动性提供者奖励", subtitle: "奖励活跃的流动性提供者，促进协议发展", totalReward: "500,000 CSWAP", reward: "150 CSWAP", totalheadCount: 5643, deadline: "2024-11-30", badge: '💧',
            reuqireConList: [{ id: 1, text: '提供流动性超过 $500', doneFlag: true }, { id: 2, text: '保持流动性 30 天', doneFlag: false }, { id: 3, text: '参与治理投票', doneFlag: false },]
        },
        {
            title: "社区建设者计划", subtitle: "奖励为社区做出贡献的用户", totalReward: "100,000 CSWAP", reward: "0 CSWAP", totalheadCount: 1342, deadline: "2025-01-15", badge: '🌟',
            reuqireConList: [{ id: 1, text: '在社交媒体分享', doneFlag: true }, { id: 2, text: '参与社区讨论', doneFlag: false }, { id: 3, text: '提交改进建议', doneFlag: false },]
        },
        {
            title: "质押奖励计划", subtitle: "已完成的质押奖励活动", totalReward: "400,000 CSWAP", reward: "320 CSWAP", totalheadCount: 1292, deadline: "2024-09-30", badge: '🔒',
            reuqireConList: [{ id: 1, text: '质押 CSWAP 代币', doneFlag: false }, { id: 2, text: '保持质押 60 天', doneFlag: false }]
        }
    ])
    return (
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
                {rewardDataList.map(item => <RewardCard key={item.title} title={item.title} subtitle={item.subtitle} totalReward={item.totalReward} reward={item.reward}
                    totalheadCount={item.totalheadCount} deadline={item.deadline} badge={item.badge} reuqireConList={item.reuqireConList} />)}
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
    )
}