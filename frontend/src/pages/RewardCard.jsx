import GlowCard from "./GlowCard";
import NButton from "./NButton";

// —— 页面4：空投 ——
const RewardCard= ({ title, subtitle, reward, progress = 0.42, deadline, badge, locked }) => (
    <GlowCard>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md text-xl">{badge}</div>
            <div>
              <div className="text-white/90 font-medium">{title}</div>
              <div className="text-xs text-white/50">{subtitle}</div>
            </div>
          </div>
          <div className={`text-[10px] px-2 py-1 rounded-md border ${locked ? "bg-amber-400/10 text-amber-300 border-amber-400/30" : "bg-cyan-400/10 text-cyan-300 border-cyan-400/30"}`}>
            {reward}
          </div>
        </div>
  
        <div className="mt-4">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="text-xs text-white/50 mt-1">{deadline || "进行中"}</div>
        </div>
  
        <div className="mt-4 flex gap-3">
          <NButton className="flex-1">查看详情</NButton>
        </div>
      </div>
    </GlowCard>
);


export default RewardCard;