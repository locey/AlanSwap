import { useState } from 'react';
import GlowCard from './GlowCard';
import EmptyState from './EmptyState';
import StatCard from './StatCard';
import StakeCard from './StakeCard';

import useStakePools from '../hooks/useStakePools';

import {  Settings  } from 'lucide-react';
import { useWallet } from './useWallet';

const STAKING_CONTRACT = import.meta.env.VITE_STAKING_ADDRESS;
export default function MiningPage({ stats }) {
  const { walletConnected, signer } = useWallet();


  const { pools, loading } = useStakePools(STAKING_CONTRACT, signer);

  const setConnectWallet = () => { };

  const stakePoolList = pools;
  
  console.log(stakePoolList, 'stakePoolList');
  return (
    <div className="space-y-8">

      <div className="text-center">
        <h1 className="text-4xl font-bold neon-text mb-2">质押挖矿</h1>
        <p className="text-muted-foreground">质押您的代币，获得丰厚奖励</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="总质押价值"
          value={stats.totalStaked}
          change="+12.5% 本月"
        />
        <StatCard title="累计奖励" value={stats.totalRewards} change="+$5.67 本日" />
        <StatCard title="平均APY" value={`${stats.activeStakes}%`} change="加权平均" />
      </div>

      {!walletConnected ? (
        <EmptyState
          connectWallet={setConnectWallet}
          icon="🔒"
          title="连接钱包开始质押"
          description="连接您的钱包以查看和管理质押"
        />
      ) : (
        <div className='space-y-6'>

          <div className='flex justify-between items-center'>
            <h2 className="text-2xl font-bold text-glow text-black">质押池</h2>
            <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden [a&]:hover:bg-primary/90 bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Settings></Settings> {stakePoolList.length}个池子
            </span>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">

            {stakePoolList.map(item => (
              <StakeCard
                poolId={item.id}
                key={item.title}
                title={item.title}
                tvl={item.tvl}
                token={item.token}
                days={item.days}
                apy={item.apy}
                deposited={item.deposited}
                badge={item.badge}
                signer={signer}
              />

            ))}

          </div>
        </div>

      )}
      {walletConnected && (
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-indigo-400/20 hover:glow-purple transition-all duration-300">
          <div className="p-5 font-semibold text-lg text-glow text-black">
            质押统计
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-black  mb-2 text-base font-semibold">收益分布</div>
              <div className="space-y-2">
                {[
                  { k: 'ETH', v: '0.0234 ETH', c: '+12.5%', badge: '🔷', apy: '12.5%', },
                  { k: 'USDC', v: '12.45 USDC', c: '+3.2%', badge: '💵', apy: '12.5%', },
                  { k: 'UNI', v: '2.34 UNI', c: '+18.7%', badge: '🦄', apy: '12.5%', },
                ].map(i => (
                  <div
                    key={i.k}
                    className="flex-col items-center justify-between text-black py-1"
                  >
                    <div className='flex justify-between items-center'>
                      <div className="flex justify-between items-center font-bold gap-2">
                        <span className="text-lg">{i.badge}</span>
                        <span className="font-medium">{i.k}</span>
                      </div>
                      <div className="font-bold ">{i.v}</div>
                    </div>

                    <div className="text-black flex justify-end  text-[11px] text-green-400">{i.apy}</div>
                  </div>

                ))}
              </div>
            </div>
            <div>
              <div className="text-black  mb-2 font-bold text-base">质押进度</div>
              <div className="space-y-1">
                {[
                  { k: 'ETH 池', v: '1.2345 ETH', progress: 0.5 },
                  { k: 'USDC 池', v: '1250.00 USDC', progress: 0.8 },
                  { k: 'UNI 池', v: '45.67 UNI', progress: 0.3 },
                ].map(i => (
                  <div
                    key={i.k}
                    className="flex-col items-center justify-between  text-black py-2"
                  >
                    <div className='flex justify-between items-center text-sm'>
                      <div  >{i.k}</div>
                      <div >{i.v}</div>
                    </div>

                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden my-2 ">
                        <div className=" h-full bg-gradient-to-r from-black to-black " style={{ width: `${i.progress * 100}px` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
