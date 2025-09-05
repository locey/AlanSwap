import GlowCard from "./GlowCard";
import NButton from "./NButton";

// —— 页面3：质押 ——
const StakeCard = ({ title, token, tvl, days, apy, deposited, badge }) => (
    <GlowCard>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xl">
            <div className="h-8 w-8 rounded-md">{badge}</div>
            <div>
              <div className="text-lg font-bold text-gray-900">{title}</div>
              <div className="text-xs text-white/50">{token} 质押池</div>
            </div>
          </div>
          <div className="text-[10px] px-2 py-1 rounded-md bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
            {apy} APY
          </div>
        </div>
  
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <div className="text-white/50">总锁仓</div>
            <div className="text-white/90">{tvl}</div>
          </div>
          <div>
            <div className="text-white/50">周期</div>
            <div className="text-white/90">{days}</div>
          </div>
          <div className="text-white/50">{deposited ? "已质押" : "未质押"}</div>
        </div>
  
        <div className="mt-4 grid grid-cols-3 gap-3">
          <NButton>质押</NButton>
          <NButton variant="ghost">解除质押</NButton>
          <NButton variant="outline">领取奖励</NButton>
        </div>
      </div>
    </GlowCard>
);

export default StakeCard;