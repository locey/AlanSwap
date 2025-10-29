import { Circle, CircleCheck, Gift, UserPlus, Clock, Lock } from "lucide-react";
import GlowCard from "./GlowCard";
import {
  DEFAULT_AIRDROP_ICON,
  AIRDROP_STATUS_ENUM,
  TASK_STATUS_ENUM,
} from "@/constants/AIRDROP_CONSTANTS";
import { useMemo, useCallback } from "react";
import { formatUnits } from "viem";
import dayjs from "dayjs";
import { get, map, uniqueId, divide, multiply, filter, isEmpty } from "lodash";
import Spin from "@/components/Spin";

export default function RewardCard(props) {
  const data = get(props, "data", {});
  const claimAirdrop = get(props, "claimAirdrop", () => {});
  const loading = get(props, "loading", false);

  const getRewards = useCallback(() => {
    claimAirdrop(data?.airdropId);
  }, [data?.airdropId]);

  const status = get(data, "status", "");

  const statusTwClassNames = get(
    AIRDROP_STATUS_ENUM,
    [status, "twClassNames"],
    ""
  );
  const statusText = get(AIRDROP_STATUS_ENUM, [status, "text"], "");

  const generateStatusIcon = useMemo(() => {
    switch (status) {
      case "claimable":
        return <UserPlus className="w-4 h-4 mr-1 inline-block" />;
      case "expired":
        return <Clock className="w-4 h-4 mr-1 inline-block" />;
      case "closed":
        return <Lock className="w-4 h-4 mr-1 inline-block" />;
      default:
        return <CircleCheck className="w-4 h-4 mr-1 inline-block" />;
    }
  }, [status]);

  const taskProgress = useMemo(() => {
    const totalCount = data?.taskList?.length || 0;
    if (totalCount === 0) return 0;
    const completedCount =
      filter(
        data?.taskList || [],
        (task) => task.status === TASK_STATUS_ENUM.finished.value
      ).length || 0;
    const result = multiply(divide(completedCount, totalCount), 100);
    return result;
  }, [data?.taskList]);

  const disabledGetReward = Number(get(data, "userPendingReward", 0)) <= 0;

  return (
    <GlowCard>
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md text-xl animate-bounce-slow">
              {data?.airDropIcon || DEFAULT_AIRDROP_ICON}
            </div>
            <div>
              <div className="text-black font-semibold text-lg neon-text-black">
                {data?.name || "空投活动名称"}
              </div>
              <div className="text-xs text-white/50">
                {data?.description || "这是一个空投活动描述"}
              </div>
            </div>
          </div>
          <div
            className={`text-[10px] px-2 py-1 rounded-md border ${statusTwClassNames}`}
          >
            {generateStatusIcon}
            {statusText}
          </div>
        </div>

        <div className="mt-4 flex-1">
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <div className="text-white/50">总奖励池</div>
              <div className="text-lg font-semibold neon-text">
                <span className="mr-2">
                  {formatUnits(data?.totalReward || 0, 18)}
                </span>
                <span>{data?.tokenSymbol}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-white/50">我的奖励</div>
              <div className="text-lg font-semibold flex items-center gap-1 neon-text-green">
                <span className="mr-2">
                  {formatUnits(data?.userTotalReward || 0, 18)}
                </span>
                <span>{data?.tokenSymbol}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <div className="text-white/50">参与人数</div>
              <div className="text-lg text-black neon-text-black">
                {data?.userCount || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/50">结束时间</div>
              <div className="text-lg text-black neon-text-black">
                {data?.endTime
                  ? dayjs(data?.endTime).format("YYYY-MM-DD HH:mm:ss")
                  : "-"}
              </div>
            </div>
          </div>
          <div className="text-xs text-white/50 mt-1">任务进度</div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden my-2">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
              style={{
                width: `${taskProgress}%`,
              }}
            />
          </div>
          <div className="my-4">
            {!isEmpty(data?.taskList) ? (
              <ul className="p-2 text-sm text-green-400 neon-text-green">
                {map(data?.taskList || [], (task) => (
                  <li key={uniqueId()}>
                    {task.status === TASK_STATUS_ENUM.finished.value ? (
                      <CircleCheck className="w-4 h-4 mr-1 inline-block" />
                    ) : (
                      <Circle className="w-4 h-4 mr-1 inline-block" />
                    )}
                    <span>{task.taskName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-black neon-text-black">暂无任务</div>
            )}
          </div>
        </div>

        <Spin spinning={loading} className="mt-4 flex gap-3">
          <button
            disabled={disabledGetReward}
            className={`box-shadow-cyan w-full items-center justify-center rounded-xl font-medium transition-all select-none h-9 px-3 text-sm border ${
              disabledGetReward
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:border-cyan-400 hover:text-cyan-400"
            }`}
            onClick={getRewards}
          >
            <Gift className="w-4 h-4 mr-1 inline-block" />
            {disabledGetReward ? "完成空投任务后可领取" : "领取奖励"}
          </button>
        </Spin>
      </div>
    </GlowCard>
  );
}
