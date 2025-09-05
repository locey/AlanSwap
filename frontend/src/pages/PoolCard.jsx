import GlowCard from "./GlowCard";
import NButton
 from "./NButton";

const PoolCard = ({ pair, tvl, vol, fee, apy, hasForm, badge }) => (
    <GlowCard>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-16 rounded-md text-xl">{badge}</div>
            <div>
              <div className="text-white/90 font-medium">{pair}</div>
              <div className="text-xs text-white/50">池概览</div>
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
            <div className="text-white/50">24h 交易量</div>
            <div className="text-white/90">{vol}</div>
          </div>
          <div>
            <div className="text-white/50">费率</div>
            <div className="text-white/90">{fee}</div>
          </div>
        </div>
  
        {hasForm && (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-3 justify-between">
                <span className="text-white/70 text-sm">ETH</span>
                <input className="bg-transparent text-right outline-none" placeholder="1.2345" />
              </div>
              <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-3 justify-between">
                <span className="text-white/70 text-sm">USDC</span>
                <input className="bg-transparent text-right outline-none" placeholder="2890.50" />
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <NButton className="flex-1"><span className="mr-4">+</span>添加流动性</NButton>
              <NButton className="flex-1" variant="ghost"><span className="mr-4">-</span>移除流动性</NButton>
            </div>
          </div>
        )}
  
        {!hasForm && (
          <div className="mt-4">
            <NButton className="w-full"><span className="mr-4">+</span>添加流动性</NButton>
          </div>
        )}
      </div>
    </GlowCard>
);

export default PoolCard;