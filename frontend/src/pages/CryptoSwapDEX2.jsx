import React, { useMemo, useState } from "react";
import {
  Wallet,
  ChevronDown,
  RefreshCw,
  ArrowUpDown,
  Sparkles,
  Lock,
  Gift,
  Droplets,
  Coins,
  BarChart3,
  Crown,
  Star,
  Flame,
  ShieldCheck,
} from "lucide-react";

/**
 * CryptoSwap – 单文件可预览 Demo
 *
 * 说明：
 * - 本组件尽量“像素级”还原你给的 4 张图的布局与风格。
 * - 未引入外部样式文件，仅用 Tailwind 原子类 + 小量内联样式实现霓虹 & 毛玻璃效果。
 * - 顶部标签切换 4 个页面：交换、流动性、质押、空投。
 * - 如需拆分为多文件/接入数据流（wagmi/viem 等），可在此基础上扩展。
 */

// 通用：霓虹发光的卡片壳
const GlowCard = ({
  className = "",
  children,
  ...rest
}) => (
  <div
    className={
      "relative rounded-2xl p-[1px] " +
      "bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-indigo-400/20 " +
      className
    }
    {...rest}
  >
    <div className="rounded-2xl bg-[#120c28]/90 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(93,0,255,0.15)]">
      {children}
    </div>
  </div>
);

// 通用：按钮
const NButton = ({ children, className = "", variant = "primary", size = "md", iconLeft }) => {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-all select-none";
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  }[size];
  const variants = {
    primary:
      "bg-gradient-to-r from-[#5f5af7] via-[#7c3aed] to-[#a855f7] hover:opacity-95 text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]",
    ghost:
      "bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-inner",
    outline:
      "border border-white/20 text-white hover:bg-white/5",
  }[variant];
  return (
    <button className={`${base} ${sizes} ${variants} ${className}`}>
      {iconLeft && <span className="mr-2">{iconLeft}</span>}
      {children}
    </button>
  );
};

// 顶部导航
const TopBar = ({ active, onChange }) => {
  const Tab = ({ id, label, icon }) => (
    <button
      onClick={() => onChange(id)}
      className={
        "relative h-11 px-5 rounded-2xl text-sm font-medium flex items-center gap-2 " +
        (active === id
          ? "bg-gradient-to-r from-indigo-500/80 to-fuchsia-500/80 text-white shadow-[0_0_18px_rgba(99,102,241,0.6)]"
          : "text-white/70 hover:text-white hover:bg-white/5")
      }
    >
      {icon}
      {label}
      {active === id && (
        <span className="absolute inset-0 -z-10 rounded-2xl blur-xl opacity-60 bg-indigo-500/30" />
      )}
    </button>
  );

  return (
    <div className="w-full h-16 flex items-center justify-between">
      {/* 左侧 Logo */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 shadow-[0_0_20px_rgba(56,189,248,0.6)]" />
        <div className="text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] font-semibold tracking-wide">
          CryptoSwap
        </div>
      </div>

      {/* 中间标签 */}
      <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 gap-1 backdrop-blur">
        <Tab id="swap" label="交换" icon={<ArrowUpDown size={16} />} />
        <Tab id="liquidity" label="流动性" icon={<Droplets size={16} />} />
        <Tab id="stake" label="质押" icon={<Lock size={16} />} />
        <Tab id="airdrop" label="空投" icon={<Gift size={16} />} />
      </div>

      {/* 右侧链/钱包 */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white/80">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span>Ethereum</span>
          <ChevronDown size={16} className="opacity-70" />
        </div>
        <NButton variant="ghost" iconLeft={<Wallet size={16} />}>
          0x1234...5678
        </NButton>
      </div>
    </div>
  );
};

// 背景：星空 + 紫色渐变
const SpaceBg = ({ children }) => (
  <div
    className="min-h-[100dvh] w-full text-white"
    style={{
      background:
        "radial-gradient(1200px 800px at 70% 20%, rgba(120, 0, 255, 0.35), transparent 60%)," +
        "radial-gradient(800px 600px at 20% 60%, rgba(15, 230, 255, 0.25), transparent 60%)," +
        "linear-gradient(180deg, #130a2a 0%, #1a0f3a 60%, #0b0720 100%)",
    }}
  >
    {/* 星空点阵 */}
    <div
      className="pointer-events-none fixed inset-0 opacity-70"
      style={{
        backgroundImage:
          "radial-gradient(1px 1px at 40px 60px, rgba(255,255,255,0.35) 1px, transparent 1px)," +
          "radial-gradient(1px 1px at 140px 160px, rgba(34,211,238,0.35) 1px, transparent 1px)," +
          "radial-gradient(1px 1px at 240px 260px, rgba(168,85,247,0.35) 1px, transparent 1px)",
        backgroundSize: "200px 200px, 300px 300px, 400px 400px",
      }}
    />
    <div className="relative z-10 container mx-auto px-4 lg:px-10 pb-24">
      {children}
    </div>
  </div>
);

// —— 页面1：交换 ——
const SwapPage = () => {
  return (
    <div className="grid lg:grid-cols-12 gap-8 pt-10">
      <div className="lg:col-start-5 lg:col-span-4">
        <GlowCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-cyan-300 font-semibold tracking-wide flex items-center gap-2">
                <Sparkles size={16} /> 交换
              </div>
              <NButton variant="ghost" size="sm">
                ~ 最优路径
              </NButton>
            </div>

            {/* From */}
            <div className="space-y-3">
              <div className="text-sm text-white/70">从</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-3">
                  <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                    <div className="h-6 w-6 rounded-full bg-white/10" />
                    <span>ETH</span>
                    <ChevronDown size={16} className="opacity-70" />
                  </div>
                  <input
                    placeholder="0.0"
                    className="bg-transparent outline-none px-3 w-full text-right"
                  />
                </div>
              </div>

              <div className="flex justify-center py-1">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <RefreshCw size={16} />
                </div>
              </div>

              {/* To */}
              <div className="text-sm text-white/70">到</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center px-3">
                  <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                    <div className="h-6 w-6 rounded-full bg-white/10" />
                    <span>USDC</span>
                    <ChevronDown size={16} className="opacity-70" />
                  </div>
                  <input
                    placeholder="0.0"
                    className="bg-transparent outline-none px-3 w-full text-right"
                  />
                </div>
              </div>

              <NButton className="w-full mt-4 h-12 text-base">输入金额</NButton>
            </div>
          </div>
        </GlowCard>

        {/* 市场概览 */}
        <div className="mt-6">
          <GlowCard>
            <div className="p-5">
              <div className="text-cyan-300 font-semibold mb-4">市场概览</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { sym: "ETH", price: "$2,340.5", change: "+2.34%" },
                  { sym: "WBTC", price: "$43,250", change: "+2.34%" },
                  { sym: "USDC", price: "$1", change: "+2.34%" },
                  { sym: "USDT", price: "$1", change: "+2.34%" },
                ].map((i) => (
                  <div
                    key={i.sym}
                    className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md bg-white/10" />
                      <div className="text-white/80">{i.sym}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/90 text-sm">{i.price}</div>
                      <div className="text-emerald-400 text-xs">{i.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
};

// —— 页面2：流动性池 ——
const StatBadge = ({ title, value }) => (
  <GlowCard>
    <div className="px-6 py-5">
      <div className="text-white/70 text-sm mb-2">{title}</div>
      <div className="text-2xl font-semibold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">{value}</div>
    </div>
  </GlowCard>
);

const PoolCard = ({ pair, tvl, vol, fee, apy, hasForm }) => (
  <GlowCard>
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white/10" />
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
            <NButton className="flex-1">添加流动性</NButton>
            <NButton className="flex-1" variant="ghost">
              移除流动性
            </NButton>
          </div>
        </div>
      )}

      {!hasForm && (
        <div className="mt-4">
          <NButton className="w-full">添加流动性</NButton>
        </div>
      )}
    </div>
  </GlowCard>
);

const LiquidityPage = () => {
  return (
    <div className="pt-8 space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatBadge title="我的流动性" value="$2,890.50" />
        <StatBadge title="累计手续费" value="$45.67" />
        <StatBadge title="活跃池子" value="1" />
      </div>

      <div className="text-white/70 text-sm flex items-center gap-2">
        <Droplets size={16} />
        所有流动性池
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">
        <PoolCard pair="ETH/USDC" tvl="$5.8M" vol="$1.2M" fee="0.05%" apy="24.5%" hasForm />
        <PoolCard pair="WBTC/ETH" tvl="$3.2M" vol="$890K" fee="0%" apy="18.7%" />
        <PoolCard pair="UNI/USDC" tvl="$1.8M" vol="$450K" fee="0%" apy="12.1%" />
        <PoolCard pair="LINK/ETH" tvl="$980K" vol="$230K" fee="0%" apy="20.1%" />
      </div>

      <GlowCard>
        <div className="p-5 grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-white/70 mb-2">收益统计</div>
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
      </GlowCard>
    </div>
  );
};

// —— 页面3：质押 ——
const StakeCard = ({ title, token, tvl, days, apy, deposited }) => (
  <GlowCard>
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white/10" />
          <div>
            <div className="text-white/90 font-medium">{title}</div>
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

const StakePage = () => {
  return (
    <div className="pt-8 space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatBadge title="总质押价值" value="$3,456.78" />
        <StatBadge title="累计奖励" value="$123.45" />
        <StatBadge title="平均 APY" value="13.7%" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-6">
        <StakeCard title="ETH 质押池" token="ETH" tvl="$2.4M" days="30天" apy="12.5%" deposited="1.2345 ETH" />
        <StakeCard title="USDC 稳定池" token="USDC" tvl="$5.8M" days="7天" apy="8.2%" />
        <StakeCard title="UNI 治理代币池" token="UNI" tvl="$890K" days="90天" apy="18.7%" />
        <StakeCard title="LINK 预言机池" token="LINK" tvl="$1.2M" days="60天" apy="15.3%" />
      </div>

      <GlowCard>
        <div className="p-5 grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-white/70 mb-2">收益分布</div>
            <div className="space-y-2">
              {[
                { k: "ETH", v: "0.0234 ETH", c: "+12.5%" },
                { k: "USDC", v: "12.45 USDC", c: "+3.2%" },
                { k: "UNI", v: "2.34 UNI", c: "+18.7%" },
              ].map((i) => (
                <div key={i.k} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <div className="text-white/80 flex items-center gap-2"><ShieldCheck size={14} className="opacity-60" />{i.k}</div>
                  <div className="text-white/90">{i.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white/70 mb-2">限期对照</div>
            <div className="space-y-2">
              {[
                { k: "ETH 池", v: "1.2345 ETH" },
                { k: "USDC 池", v: "1250.00 USDC" },
                { k: "UNI 池", v: "45.67 UNI" },
              ].map((i) => (
                <div key={i.k} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <div className="text-white/70">{i.k}</div>
                  <div className="text-white/90">{i.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlowCard>
    </div>
  );
};

// —— 页面4：空投 ——
const RewardCard= ({ title, subtitle, reward, progress = 0.42, deadline, badge, locked }) => (
  <GlowCard>
    <div className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white/10" />
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
        <NButton className="flex-1">查看任务</NButton>
        <NButton variant="ghost" className="flex-1">提交凭证</NButton>
      </div>
    </div>
  </GlowCard>
);

const AirdropPage= () => {
  return (
    <div className="pt-8 space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <StatBadge title="已领积分" value={"720 CSWAP"} />
        <StatBadge title="进行中" value={"320 CSWAP"} />
        <StatBadge title="待领取" value={"400 CSWAP"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RewardCard title="CryptoSwap Genesis 空投" subtitle="完成启动任务，瓜分首批 CS" reward="250 CSWAP" deadline="2024-12-31" />
        <RewardCard title="流动性贡献奖励" subtitle="提供流动性、赚取交易手续费" reward="150 CSWAP" deadline="2024-11-30" />
        <RewardCard title="社区贡献者计划" subtitle="参与治理/内容/活动宣传" reward="0 CSWAP" deadline="2025-01-15" />
        <RewardCard title="忠诚奖励计划" subtitle="持续交互享更多奖励" reward="320 CSWAP" locked deadline="2024-09-30" />
      </div>

      <GlowCard>
        <div className="p-5">
          <div className="text-white/80 font-medium mb-3">空投排行榜</div>
          <div className="divide-y divide-white/10">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    {i === 1 ? <Crown size={16} /> : i === 2 ? <Star size={16} /> : <Flame size={16} />}
                  </div>
                  <div className="text-white/80">#{i}</div>
                </div>
                <div className="text-cyan-300">{[1250, 980, 750, 720, 650][i - 1]} CSWAP</div>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>
    </div>
  );
};

// 页面容器
export default function CryptoSwapApp() {
  const [tab, setTab] = useState<"swap" | "liquidity" | "stake" | "airdrop">(
    "swap"
  );

  const Page = useMemo(() => {
    switch (tab) {
      case "swap":
        return <SwapPage />;
      case "liquidity":
        return <LiquidityPage />;
      case "stake":
        return <StakePage />;
      case "airdrop":
        return <AirdropPage />;
      default:
        return null;
    }
  }, [tab]);

  return (
    <SpaceBg>
      <TopBar active={tab} onChange={(t) => setTab(t)} />
      {Page}
      {/* 右下角“Made with Manus” 角标（纯装饰） */}
      <div className="fixed right-4 bottom-4 text-xs text-white/50 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
        Made with Manus
      </div>
    </SpaceBg>
  );
}
