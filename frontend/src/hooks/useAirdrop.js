import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  getAirdropOverview,
  getAirdropAvailable,
  getAirdropRanking,
  claimReward,
  getUserTasks,
} from "@/apis/airdrop";
import { get } from "lodash";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_RANKING_SIZE,
  DEFAULT_RANKING_SORT_BY,
  TABS_ENUM,
} from "@/constants/AIRDROP_CONSTANTS";
import to from "await-to-js";
import {
  DEFAULT_AVAILABLES,
  DEFAULT_TAB_KEY,
} from "@/constants/AIRDROP_CONSTANTS";

const useAirdrop = (props) => {
  const address = get(props, "address", undefined);
  const tabKey = get(props, "tabKey", DEFAULT_TAB_KEY);

  const [overview, setOverview] = useState();

  const [availables, setAvailables] = useState(DEFAULT_AVAILABLES);

  const [ranking, setRanking] = useState([]);

  const [userTasks, setUserTasks] = useState([]);

  const [loadings, setLoadings] = useState({
    overview: false,
    availables: false,
    ranking: false,
    userTasks: false,
    claimAirdrop: false,
  });

  const fetchAirdropOverview = async () => {
    if (!address) return;
    setLoadings({ ...loadings, overview: true });
    const [err, res] = await to(getAirdropOverview({ walletAddress: address }));
    if (err || res?.msg !== "OK") {
      console.log(`获取空投奖励概览res: ${res}`);
      console.error(err);
      toast.error(`获取空投奖励概览失败: ${err}`);
      setLoadings({ ...loadings, overview: false });
      return;
    }
    setOverview(res?.data || {});
    setLoadings({ ...loadings, overview: false });
  };

  const fetchAirdropAvailable = async () => {
    if (!address || tabKey !== TABS_ENUM.AIRDROP.key) return;
    setLoadings({ ...loadings, availables: true });
    const [err, res] = await to(
      getAirdropAvailable({
        walletAddress: address,
      })
    );
    if (err || res?.msg !== "OK") {
      console.log(`获取空投可参与列表res: ${res}`);
      console.error(err);
      toast.error(`获取空投可参与列表失败: ${err}`);
      setLoadings({ ...loadings, availables: false });
      return;
    }
    setAvailables(res?.data || DEFAULT_AVAILABLES);
    setLoadings({ ...loadings, availables: false });
  };

  const fetchUserTasks = async () => {
    if (!address || tabKey !== TABS_ENUM.DROP_TASK.key) return;
    setLoadings({ ...loadings, userTasks: true });
    const [err, res] = await to(getUserTasks({ walletAddress: address }));
    if (err || res?.msg !== "OK") {
      console.log(`获取用户任务列表res: ${res}`);
      console.error(err);
      toast.error(`获取用户任务列表失败: ${err}`);
      setLoadings({ ...loadings, userTasks: false });
      return;
    }
    const data = get(res, ["data", "list"], []);
    setUserTasks(data);
    setLoadings({ ...loadings, userTasks: false });
  };

  const fetchAirdropRanking = async () => {
    if (!address) return;
    setLoadings({ ...loadings, ranking: true });
    const [err, res] = await to(
      getAirdropRanking({
        sortBy: DEFAULT_RANKING_SORT_BY,
        page: DEFAULT_CURRENT_PAGE,
        size: DEFAULT_RANKING_SIZE,
      })
    );
    if (err || res?.msg !== "OK") {
      console.log(`获取空投排行榜res: ${res}`);
      console.error(err);
      toast.error(`获取空投排行榜失败: ${err}`);
      setLoadings({ ...loadings, ranking: false });
      return;
    }
    setRanking(res?.data || {});
    setLoadings({ ...loadings, ranking: false });
  };

  const claimAirdrop = async (airdropId) => {
    if (!address) return;
    setLoadings({ ...loadings, claimAirdrop: true });
    const [err, res] = await to(
      claimReward({ walletAddress: address, airdropId })
    );
    if (err || res?.msg !== "OK") {
      console.log(`领取空投奖励res: ${res}`);
      console.error(err);
      toast.error(`领取空投奖励失败: ${err}`);
      setLoadings({ ...loadings, claimAirdrop: false });
      return;
    }
    toast.success(`领取空投奖励成功`);
    setLoadings({ ...loadings, claimAirdrop: false });

    fetchAirdropOverview();
    fetchAirdropAvailable();
    fetchAirdropRanking();
  };

  useEffect(() => {
    fetchAirdropOverview();
    fetchAirdropRanking();
  }, [address]);

  useEffect(() => {
    fetchAirdropAvailable();
    fetchUserTasks();
  }, [address, tabKey]);

  return {
    overview,
    availables,
    ranking,
    userTasks,
    loadings,
    claimAirdrop,
  };
};

export default useAirdrop;
