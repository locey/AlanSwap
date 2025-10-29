import { useState, useEffect } from 'react';
import GlowCard from './GlowCard';
import { parseUnits } from 'ethers';
import { Lock, Plus, TrendingUp, Clock, PlusCircle, Unlock, Gift } from 'lucide-react';
import useSepoliaStake from '../hooks/useSepoliaStake';
import { ethers } from 'ethers';
const VITE_BASEURL = import.meta.env.VITE_BASEURL;
import { useWallet } from './useWallet';
// —— 页面3：质押 ——
export default function StakeCard({
  poolId,
  title,
  token,
  tvl,
  days,
  apy,
  deposited,
  badge,
  signer,
}) {
  const { walletConnected, address, chainId } = useWallet();



  const { stake, withdraw, getPoolFullInfo, hasGetBonus } = useSepoliaStake(walletConnected, signer);

  const [depositeNum, setdepositeNum] = useState('');
  const [depositeTemp, setdepositeTemp] = useState('');
  const [showInputFlag, toggleShowInputFlag] = useState(false);
  const [type, setType] = useState('');
  const [val, setVal] = useState('');
  const [haveDeposited, togggleHaveFlag] = useState(false);
  const [showStake, setShowStake] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [stakedObj, setStakedObj] = useState({  tvl: '0', poolUnclaimed: '0', records: [], totalRecords: 0  });


  useEffect(() => {
    setShowStake(true);
  }, [address, chainId]);

  useEffect(() => {
    // 非空且大于 0 就认为“有值”
    setCanSubmit(depositeTemp && parseFloat(depositeTemp) > 0);
  }, [depositeTemp]);



  useEffect(() => {
    (async () => {
      try {
        const userInfo = await getPoolFullInfo(poolId, address);
        setStakedObj(userInfo);
      } catch (e) {
        console.error(e);
        setStakedObj({  tvl: '0', poolUnclaimed: '0', records: [], totalRecords: 0  });
      }
    })();
  }, [poolId, address]);

  // 获取质押数量


  const handleStake = async (title, type) => {
    if (depositeTemp > 0) {
      setdepositeNum(depositeTemp);
    }
    if (!depositeTemp) return;
    //解除质押
    if (type === 'minus') {
      toggleShowInputFlag(false);
      await withdraw(poolId, depositeTemp);
      setdepositeNum('');
      setShowStake(true);
    } else if (type === 'add') {
      toggleShowInputFlag(false);
      await stake(poolId, depositeTemp);
      setdepositeNum('');
      setShowStake(true);
    }
    setVal('');
  };

  // 质押按钮
  const handleAddDeposited = async e => {
    setdepositeTemp('');
    toggleShowInputFlag(true);
    setVal('');
    setType('add');
    setShowStake(false);
  };
  // 解除质押按钮
  const handleMinusDeposited = async e => {
    setdepositeTemp('');
    toggleShowInputFlag(true);
    setVal('');
    setType('minus');
  };
  const handlegetBonus = async e => {
    console.log({ e }, '领取奖励');
    hasGetBonus(poolId);
  };


  
  const cancelAddDeposited = () => {
    console.log('-cancel_AddDeposited=');
    setdepositeNum('');
    togggleHaveFlag(false);
    toggleShowInputFlag(false);
    setShowStake(true);
  };


  return (
    <GlowCard>

      <div className="p-5  flex flex-col">

        <div className="flex  justify-between ">
          <div className="flex items-center gap-3 text-xl">
            <div className="h-8 w-8 rounded-md animate-float">{badge}</div>
            <div>
              <div className="text-lg font-bold text-gray-900">{title}</div>
              <div className="text-xs text-white/50">{token} 质押</div>
            </div>
          </div>
          <div className=" flex gap-2 text-[10px] rounded-md text-emerald-300 h-6 ">
            <span className="inline-flex items-center justify-center rounded-lg border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden [a&]:hover:bg-secondary/90 bg-green-500/20 text-green-400 border-green-500/30 glow-green">
              <TrendingUp className="lucide lucide-trending-up h-3 w-3 mr-1" />
              {apy} APY
            </span>
          </div>
        </div>



        <div className="grid grid-cols-2 gap-10 mt-12 text-sm">
          <div className='space-y-1'>
            <div className="text-xs text-white/50">总锁定价值</div>
            <div className="text-lg font-semibold neon-text">${stakedObj.tvl}</div>
          </div>
          <div className='space-y-1'>
            <div className="text-xs text-white/50">锁定期</div>
            <div className="text-lg text-black font-semibold flex items-center gap-1">
              <Clock className="w-4 h-4 mr-1" />
              {days} 
            </div>
          </div>

        </div>

        <div className="p-3 bg-[#765099] rounded-lg  border border-[1px]  border-[#8a66a8]   mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">已质押</span>
            <span className="font-semibold text-black">{stakedObj.myStaked} {token}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">待领取奖励</span>
            <span className="font-semibold text-green-400 text-glow">{stakedObj.myRewards} {token}</span>
          </div>
        </div>

        {showInputFlag && (
          <div className="space-y-2 animate-slide-up mt-4">
            <input
              type="text"
              className="  file:text-foreground placeholder:text-muted-foreground selection:bg-primary 
              selection:text-primary-foreground dark:bg-input/30 
              flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs
               transition-[color,box-shadow] outline-none file:inline-flex file:h-7 
               file:border-0 file:bg-transparent file:text-sm file:font-medium 
               disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
                focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] 
                aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
                 bg-card/50 border-border/50 text-black"
              value={depositeTemp}
              onChange={e => setdepositeTemp(e.target.value)}
              placeholder={`请输入 ${token} 数量`}
            />
            <div className="col-span-2 flex gap-2 items-center">
              <button
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 button-glow"
                onClick={() => handleStake(title, type)}
              >
                <Lock className="w-4 h-4 mr-1" />
                {type === 'add' ? '确认质押' : '确认解除质押'}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 py-2 has-[>svg]:px-3 px-4"
                onClick={() => cancelAddDeposited(title)}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className={`
              mt-4 grid
              ${showStake ? 'grid-cols-3 gap-3' : 'grid-cols-2 gap-2'}
            `}>
          {showStake && (<button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 button-glow"
            onClick={() => handleAddDeposited(title)}
          >
            <Plus className="w-4 h-4 mr-1" />
            质押
          </button>)}
          <button
            className="inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border border-white/20 text-white hover:bg-white/5"
            onClick={() => handleMinusDeposited(title)}
          >
            <Unlock className="w-4 h-4 mr-1" />
            解除质押
          </button>
          <button
            className="inline-flex items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border border-white/20 text-white hover:bg-white/5"
            onClick={() => handlegetBonus(title)}
          >
            <Gift className="w-4 h-4 mr-1" />
            领取奖励
          </button>
        </div>
      </div>
    </GlowCard>
  );
}
