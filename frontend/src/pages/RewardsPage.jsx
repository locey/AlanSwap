import { useState } from "react";
import EmptyState from "./EmptyState";
import StatCard from "./StatCard";
import RewardCard from "./RewardCard";
import { Medal, Trophy } from "lucide-react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import useAirdrop from "@/hooks/useAirdrop";
import { map, uniqueId, isEmpty } from "lodash";
import {
  TABS_ENUM,
  DEFAULT_TAB_KEY,
  DEFAULT_TASK_ICON,
  USER_TASK_STATUS_ENUM,
} from "@/constants/AIRDROP_CONSTANTS";
import { CircleCheck } from "lucide-react";
import { formatUnits } from "viem";
import GlowCard from "./GlowCard";
import Spin from "@/components/Spin";

export default function RewardsPage() {
  const { isConnected, address } = useAccount();

  const { openConnectModal } = useConnectModal();

  const [tabKey, setTabKey] = useState(DEFAULT_TAB_KEY);

  const { overview, availables, ranking, claimAirdrop, userTasks, loadings } =
    useAirdrop({
      address,
      tabKey,
    });

  const handleTabKeyChange = (key) => {
    return () => {
      setTabKey(key);
    };
  };

  const generateEmptyState = () => {
    return (
      <EmptyState
        connectWallet={openConnectModal}
        icon="🎁"
        title={TABS_ENUM[tabKey].emptyTitle}
        description={TABS_ENUM[tabKey].emptyDescription}
      />
    );
  };

  const generateOverview = () => {
    return (
      <Spin spinning={loadings.overview}>
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="总奖励"
              value={overview?.totalRewards || "0 CSWAP"}
              change={overview?.totalRewardsWeeklyChange || "0 CSWAP"}
              gradient="neon-text"
            />
            <StatCard
              title="已领取"
              value={overview?.claimedRewards || "0 CSWAP"}
              change={`价值 ~$${overview?.claimedRewardsValue || "0"}`}
              gradient="neon-text-green"
            />
            <StatCard
              title="待领取"
              value={overview?.pendingRewards || "0 CSWAP"}
              change={`价值 ~$${overview?.pendingRewardsValue || "0"}`}
              gradient="neon-text-purple"
            />
          </div>

          <div className="flex justify-center mb-4">
            {map(TABS_ENUM, (tab) => (
              <button
                key={tab.key}
                className={`text-font-bold px-8 py-2 rounded-2xl neon-text-white ${
                  tabKey === tab.key
                    ? "bg-gradient-to-r from-blue-600 to-purple-600"
                    : ""
                } `}
                onClick={handleTabKeyChange(tab.key)}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <h1 className="mb-4 text-2xl font-bold neon-text-black">
            {TABS_ENUM[tabKey].name}
          </h1>
        </div>
      </Spin>
    );
  };

  const generateAvailableContent = () => {
    return (
      <Spin spinning={loadings.availables}>
        {isEmpty(availables?.list) ? (
          <div className="border border-white/10 rounded-2xl p-12 text-center mx-auto mb-8 bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-indigo-400/20">
            <h3 className="font-semibold mb-3 neon-text-white">暂无数据</h3>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {map(availables?.list || [], (item) => (
              <RewardCard
                key={uniqueId()}
                data={item}
                claimAirdrop={claimAirdrop}
                loading={loadings.claimAirdrop}
              />
            ))}
          </div>
        )}
      </Spin>
    );
  };

  const generateDropTaskContent = () => {
    return (
      <Spin spinning={loadings.userTasks}>
        {isEmpty(userTasks) ? (
          <div className="border border-white/10 rounded-2xl p-12 text-center mx-auto mb-8 bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-indigo-400/20">
            <h3 className="font-semibold mb-3 neon-text-white">暂无数据</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {map(userTasks || [], (item) => {
              const isTaskFinished =
                item?.userStatus === USER_TASK_STATUS_ENUM.finished.value;
              return (
                <GlowCard key={uniqueId()}>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md text-2xl animate-bounce-slow">
                          {item?.iconUrl || DEFAULT_TASK_ICON}
                        </div>
                        <div className="text-black font-semibold text-lg neon-text-black">
                          {item?.taskName || "任务名称"}
                        </div>
                      </div>

                      <div>
                        {isTaskFinished ? (
                          <CircleCheck className="text-xl inline-block neon-text-green" />
                        ) : (
                          <div className="box-shadow-cyan text-purple-400 text-xs font-semibold border border-purple-400/30 rounded-md px-2 py-1 bg-purple-400/10">
                            {formatUnits(item?.taskReward || 0, 18)} CSWAP
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-white/50 mb-8 wrap-break-word">
                      {item?.description || "这是一个任务描述"}
                    </div>

                    {!isTaskFinished && (
                      <div>
                        <button
                          className="box-shadow-cyan w-full items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border hover:border-cyan-400 hover:text-cyan-400"
                          onClick={() => window.open(item?.actionUrl, "_blank")}
                        >
                          完成任务
                        </button>
                      </div>
                    )}
                  </div>
                </GlowCard>
              );
            })}
          </div>
        )}
      </Spin>
    );
  };

  const generateRanking = () => {
    return (
      <Spin spinning={loadings.ranking}>
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-indigo-400/20 hover:glow-purple transition-all duration-300">
          <div className="p-5">
            <div className="text-black font-extrabold text-lg mb-3">
              <Trophy className="w-6 h-6 mr-1 inline-block" />
              空投排行榜
            </div>
            {isEmpty(ranking?.list) ? (
              <div className="text-center mx-auto mb-8">
                <h3 className="font-semibold mb-3 neon-text-white">暂无数据</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {map(ranking?.list || [], (item) => (
                  <div
                    key={uniqueId()}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-purple-400/50 bg-purple-400/30"
                  >
                    <div className="flex items-center gap-3">
                      <Medal className="w-6 h-6 mr-1 text-yellow-500" />
                      <div className="flex flex-col">
                        <div className="font-semibold text-black">
                          # {item?.Rank || "未知排名"}
                        </div>
                        <div className="text-sm text-muted-foreground text-gray-500">
                          {item?.WalletAddress || "未知钱包"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="font-semibold text-green-400">
                        {item?.ClaimAmountFormatted || "0 CSWAP"}
                      </div>
                      <div className="text-sm text-muted-foreground text-gray-500">
                        总奖励
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Spin>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold neon-text mb-2">空投奖励</h1>
        <p className="text-muted-foreground">参与活动，获得免费代币奖励</p>
      </div>

      {generateOverview()}
      {!isConnected ? (
        <div>{generateEmptyState()}</div>
      ) : (
        <div>
          {tabKey === TABS_ENUM.AIRDROP.key && generateAvailableContent()}
          {tabKey === TABS_ENUM.DROP_TASK.key && generateDropTaskContent()}
          {generateRanking()}
        </div>
      )}
    </div>
  );
}
