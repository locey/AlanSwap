import { useState } from 'react';
import { ethers } from 'ethers';

import STAKE_ABI from '../abi/STAKE_ABI.json';   //abi文件
export default function useSepoliaStake(walletConnected, signer) {



  const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC;
  const [txing, setTxing] = useState(false);
  const POOL_PROXY = import.meta.env.VITE_STAKING_ADDRESS;
  // 质押
  const stake = async (poolId, ethAmount) => {
    setTxing(true);
    try {
      console.log(signer, 'signer');
      const pool = new ethers.Contract(POOL_PROXY, STAKE_ABI, signer);
      console.log(poolId, ethAmount);
      const tx = await pool.depositEth(poolId, { value: ethers.parseEther(ethAmount) });
      await tx.wait();
    } catch (error) {
      console.error('质押失败', error);
    } finally {
      setTxing(false);
    }
  };

  // 解除质押
  const withdraw = async (poolId, amount) => {
    setTxing(true);
    try {
      const pool = new ethers.Contract(POOL_PROXY, STAKE_ABI, signer);

      const tx = await pool.withdraw(poolId, ethers.parseEther(String(amount)));
      await tx.wait();
      alert('解除质押成功');
    } catch (error) {
      console.error('解除质押失败', error);
    } finally {
      setTxing(false);
    }
  };


  /**
   * 取出 getUserInfo 全部数据并格式化
   * @param {number|bigint} poolId
   * @returns {Promise<{
   *   tvl: string,
   *   poolUnclaimed: string,
   *   records: {amount:string,stakedAt:number,unlockTime:number,price:string}[],
   *   totalRecords: number
   * }>}
   */
  async function getPoolFullInfo(poolId, userAddress) {
    const stake = new ethers.Contract(POOL_PROXY, STAKE_ABI, signer);
    const [tvlWei, poolUnclaimedWei, stakes, totalRecords] = await stake.getUserInfo(poolId);

    // 🔽 新增：个人累加
    const myStakeWei = stakes.reduce((s, rec) => s + rec.amount, 0n);
    // 若 StakeRecord 里无 unclaimed 字段，用下面这行补
    const [, myRewardsWei] = await stake.users(poolId, userAddress);

    return {
      tvl: ethers.formatEther(tvlWei),           // 总锁定价值
      lockDuration: Number((await stake.pools(poolId)).lockDuration), // 锁定期（秒）
      myStaked: ethers.formatEther(myStakeWei),  // 我已质押
      myRewards: ethers.formatEther(myRewardsWei), // 我待领取
      records: stakes.map(s => ({
        amount: ethers.formatEther(s.amount),
        stakedAt: Number(s.stakedAt),
        unlockTime: Number(s.unlockTime),
        price: ethers.formatEther(s.initialSharePrice)
      })),
      totalRecords: Number(totalRecords)
    };
  }
  const hasGetBonus = async (poolId) => {
    setTxing(true);
    try {
      const pool = new ethers.Contract(POOL_PROXY, STAKE_ABI, signer);
      console.log('claimRewards', poolId);
      const tx = await pool.claimRewards(poolId);
      await tx.wait();
      alert('奖励领取成功');
    } catch (error) {
      console.error('领取奖励失败', error);
    } finally {
      setTxing(false);
    }

  }
  return { stake, withdraw, getPoolFullInfo, hasGetBonus, txing };
}