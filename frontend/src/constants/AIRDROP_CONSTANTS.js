export const TABS_ENUM = {
  AIRDROP: {
    key: "AIRDROP",
    name: "空投活动",
    emptyTitle: "连接钱包参与空投",
    emptyDescription: "连接您的钱包以参与空投活动并领取奖励",
  },
  DROP_TASK: {
    key: "DROP_TASK",
    name: "任务中心",
    emptyTitle: "连接钱包开始任务",
    emptyDescription: "连接钱包以完成任务并获得奖励",
  },
};

export const DEFAULT_TAB_KEY = TABS_ENUM.AIRDROP.key;

export const DEFAULT_CURRENT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_RANKING_SIZE = 5;
export const DEFAULT_RANKING_SORT_BY = "amount";

export const DEFAULT_AIRDROP_ICON = "🚀";
export const DEFAULT_TASK_ICON = "🎯";

export const DEFAULT_AVAILABLES = {
  list: [],
  total: 0,
};

export const AIRDROP_STATUS_ENUM = {
  claimable: {
    text: "可申请",
    twClassNames:
      "bg-cyan-400/10 text-green-400 border-cyan-400/30 box-shadow-cyan",
  },
  expired: {
    text: "已过期",
    twClassNames:
      "bg-yellow-400/10 text-yellow-400 border-yellow-400/30 box-shadow-cyan",
  },
  closed: {
    text: "已关闭",
    twClassNames:
      "bg-red-400/10 text-red-400 border-red-400/30 box-shadow-cyan",
  },
};

export const TASK_STATUS_ENUM = {
  unfinished: {
    value: 0,
    text: "未完成",
  },
  finished: {
    value: 1,
    text: "已完成",
  },
};

export const USER_TASK_STATUS_ENUM = {
  unfinished: {
    value: 0,
    text: "未完成",
  },
  finished: {
    value: 1,
    text: "已完成",
  },
};
