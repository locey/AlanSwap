import { Circle, CircleCheck, Clock, ExternalLink, Zap } from "lucide-react";
import GlowCard from "./GlowCard";


export default function RewardCard({ title, subtitle, totalReward, reward, totalheadCount, reuqireConList, progress = 0.42, deadline, badge }) {

  const handleQueryDetail = (t) => {
    console.log({ t })
  }
  return (
    <GlowCard>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md text-xl animate-bounce-slow">{badge}</div>
            <div>
              <div className="text-black font-semibold text-lg">{title}</div>
              <div className="text-xs text-white/50">{subtitle}</div>
            </div>
          </div>
          <div className={`text-[10px] px-2 py-1 rounded-md border ${new Date(deadline) > new Date() ? "bg-cyan-400/10 text-green-400 border-cyan-400/30" :"text-black border-black"}`}>
            {new Date(deadline) > new Date() ? <Zap className="w-4 h-4 mr-1 inline-block text-green-400" /> : <CircleCheck className="w-4 h-4 mr-1 inline-block" /> }
            {new Date(deadline) > new Date() ? "进行中" : "已结束"}
          </div>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <div className="text-white/50">总奖励池</div>
              <div className="text-lg font-semibold neon-text">{totalReward}</div>
            </div>
            <div>
              <div className="text-xs text-white/50">我的奖励</div>
              <div className="text-lg text-green-500 font-semibold flex items-center gap-1">{reward}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <div className="text-white/50">参与人数</div>
              <div className="text-lg text-black">{totalheadCount}</div>
            </div>
            <div>
              <div className="text-xs text-white/50">结束时间</div>
              <div className="text-lg text-black font-semibold flex items-center gap-1">{deadline}</div>
            </div>
          </div>
          <div className="text-xs text-white/50 mt-1">任务进度</div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden my-2">
            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${new Date(deadline) > new Date() ? progress * 100 : 100}%` }} />
          </div>
          <ul className="p-2 text-sm text-green-400">
            {reuqireConList.map(v => <li key={v.id}>
              {v.doneFlag ? <CircleCheck className="w-4 h-4 mr-1 inline-block" /> : <Circle className="w-4 h-4 mr-1 inline-block" />}
              <span>{v.text}</span>
              </li>)}
          </ul>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="w-full items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border hover:text-white"
            onClick={() => handleQueryDetail(title)}><ExternalLink className="w-4 h-4 mr-1 inline-block" />查看详情</button>
        </div>
      </div>
    </GlowCard>
  );
}