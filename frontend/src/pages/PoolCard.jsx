import { useState } from "react";
import GlowCard from "./GlowCard";

export default function PoolCard({ pair, tvl, vol, fee, myshare, apy, hasForm, badge }) {
  const [amountA, setamountA] = useState('');
  const [amountB, setamountB] = useState('');
  const [liquidInputFlag, toggleLiquidInputFlag] = useState(false);
  const handleAddLiquidity = (v) => {
    console.log('add, paor_: ', {amountA, amountB})
    toggleLiquidInputFlag(false)
  }
  const handleRemoveLiquidity = (v) => {
    setamountA('')
    setamountB('')
    console.log('remove, paor_: ', v)
    toggleLiquidInputFlag(false)
  }
  return (
    <GlowCard>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-16 rounded-md text-xl">{badge}</div>
            <div>
              <div className="text-black text-lg font-bold">{pair}</div>
              <div className="text-xs text-muted-foreground">流动性池</div>
            </div>
          </div>
          <div className="text-[10px] px-2 py-1 rounded-md bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
            {apy} APY
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">总锁定价值</div>
            <div className="text-lg font-semibold neon-text">{tvl}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">24h 交易量</div>
            <div className="text-black text-lg font-semibold">{vol}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">24h 手续费</div>
            <div className="text-lg font-semibold text-green-400 text-glow">{fee}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">我的份额</div>
            <div className="text-lg font-semibold text-purple-400">{myshare}</div>
          </div>
        </div>

        {liquidInputFlag && (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-3 justify-between">
                <span className="text-white/70 text-sm">{pair.split('/')[0]} 数量</span>
                <input className="bg-transparent text-right outline-none" value={amountA} onChange={e=> setamountA(e.target.value)} />
              </div>
              <div className="h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-3 justify-between">
                <span className="text-white/70 text-sm">{pair.split('/')[1]} 数量</span>
                <input className="bg-transparent text-right outline-none" value={amountB} onChange={e=> setamountB(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <button className="flex-1 inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border border-white/20 text-white bg-green-400 hover:bg-green-500"
                onClick={() => handleAddLiquidity(pair)} disabled={!(amountA && amountB)}><span className="mr-4">+</span>添加流动性</button>
              <button className="w-[100px] inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border border-white/20 text-white hover:bg-white/5"
                onClick={() => handleRemoveLiquidity(pair)}><span className="mr-4">-</span>取消</button>
            </div>
          </div>
        )}

        {!liquidInputFlag && (
          <div className="mt-4">
              <button className="w-full inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border border-white/20 text-white hover:bg-white/5"
                onClick={() => toggleLiquidInputFlag(true)}><span className="mr-4">+</span>添加流动性</button>
          </div>
        )}
      </div>
    </GlowCard>
  );
}
