import { useState } from "react";
import GlowCard from "./GlowCard";
import { TrendingUp, Clock, PlusCircle, Unlock, Gift } from "lucide-react";

// —— 页面3：质押 ——
export default function StakeCard({ title, token, tvl, days, apy, deposited, badge }) {
  const [haveDeposited, togggleHaveFlag] = useState(false);
  const handleAddDeposited = (e) =>{
    setdepositeTemp('');
    toggleShowInputFlag(true);
    console.log({e }, "已质押")
  }
  const handleMinusDeposited = (e) =>{
    togggleHaveFlag(false);
    console.log({e }, "未质押")
  }
  const handlegetBonus = (e) =>{
    console.log({e }, "领取奖励")
  }
  const [depositeNum, setdepositeNum] = useState('');
  const [depositeTemp, setdepositeTemp] = useState('');
  const [showInputFlag, toggleShowInputFlag] = useState(false);
  const confirmAddDeposited = ()=>{
    console.log("===confirm_AddDeposited")
    if(depositeTemp > 0) {
      setdepositeNum(depositeTemp)
    }
    togggleHaveFlag(true);
    toggleShowInputFlag(false);
  }
  const cancelAddDeposited = ()=>{
    console.log('-cancel_AddDeposited=')
    setdepositeNum('');
    togggleHaveFlag(false);
    toggleShowInputFlag(false);
  }
  return (
    <GlowCard>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xl">
            <div className="h-8 w-8 rounded-md animate-float">{badge}</div>
            <div>
              <div className="text-lg font-bold text-gray-900">{title}</div>
              <div className="text-xs text-white/50">{token} 质押</div>
            </div>
          </div>
          <div className="text-[10px] px-2 py-1 rounded-md bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
            <TrendingUp className="w-4 h-4 mr-1" />
            {apy} APY
          </div>
        </div>
  
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <div className="text-white/50">总锁定价值</div>
            <div className="text-lg font-semibold neon-text">{tvl}</div>
          </div>
          <div>
            <div className="text-xs text-white/50">锁定期</div>
            <div className="text-lg text-black font-semibold flex items-center gap-1"><Clock className="w-4 h-4 mr-1" />{days}</div>
          </div>
          <div>
            <div className="text-white/50">{haveDeposited ? "已质押" : "未质押"}</div>
            {depositeNum>0 && <div className="text-white/90">{depositeNum}</div>}
          </div>
        </div>

        {showInputFlag && <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <input type="text" className="border rounded p-1 m-1 bg-transparent" value={depositeTemp} onChange={e=> setdepositeTemp(e.target.value)} placeholder={`请输入 ${token} 数量`} />
          <button className="inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border text-white bg-green-600 hover:bg-green-700"
            onClick={() => confirmAddDeposited(title)}>确认质押</button>
          <button className="inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border"
            onClick={() => cancelAddDeposited(title)}>取消</button>
          <div className="text-white/50">{haveDeposited ? "已质押" : "未质押"}</div>
        </div>}
  
        <div className="mt-4 grid grid-cols-3 gap-3">
          <button className="inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border border-white/20 text-white hover:bg-white/5"
            onClick={() => handleAddDeposited(title)}><PlusCircle className="w-4 h-4 mr-1" />质押</button>
          <button className="inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border border-white/20 text-white hover:bg-white/5"
            onClick={() => handleMinusDeposited(title)}><Unlock className="w-4 h-4 mr-1" />解除质押</button>
          <button className="inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border border-white/20 text-white hover:bg-white/5"
            onClick={() => handlegetBonus(title)}><Gift className="w-4 h-4 mr-1" />领取奖励</button>
        </div>
      </div>
    </GlowCard>
  );
};