/**
 * 调试工具：检查用户的流动性
 */

import { ethers } from 'ethers';
import FactoryABI from '../contracts/abis/Factory.json';
import PairABI from '../contracts/abis/Pair.json';
import ERC20ABI from '../contracts/abis/ERC20.json';

export async function checkUserLiquidity(provider, factoryAddress, tokenA, tokenB, userAddress) {
  try {
    console.log('=== 开始检查流动性 ===');
    console.log('Factory:', factoryAddress);
    console.log('TokenA:', tokenA);
    console.log('TokenB:', tokenB);
    console.log('User:', userAddress);

    // 1. 获取 Pair 地址
    const factoryContract = new ethers.Contract(factoryAddress, FactoryABI, provider);
    const pairAddress = await factoryContract.getPair(tokenA, tokenB);

    console.log('Pair 地址:', pairAddress);

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      console.log('❌ Pair 不存在');
      return null;
    }

    // 2. 查询用户的 LP Token 余额
    const pairContract = new ethers.Contract(pairAddress, PairABI, provider);
    const lpBalance = await pairContract.balanceOf(userAddress);

    console.log('LP Token 余额 (wei):', lpBalance.toString());
    console.log('LP Token 余额 (格式化):', ethers.formatEther(lpBalance));

    // 3. 查询池子信息
    const [reserves, totalSupply, token0, token1] = await Promise.all([
      pairContract.getReserves(),
      pairContract.totalSupply(),
      pairContract.token0(),
      pairContract.token1(),
    ]);

    console.log('储备量 reserve0:', reserves[0].toString());
    console.log('储备量 reserve1:', reserves[1].toString());
    console.log('总供应量:', ethers.formatEther(totalSupply));
    console.log('Token0:', token0);
    console.log('Token1:', token1);

    // 4. 计算份额
    if (lpBalance > 0n) {
      const sharePercent = (Number(lpBalance) / Number(totalSupply)) * 100;
      console.log('您的份额:', sharePercent.toFixed(6), '%');
    }

    console.log('=== 检查完成 ===');

    return {
      pairAddress,
      lpBalance: lpBalance.toString(),
      reserves,
      totalSupply: totalSupply.toString(),
      token0,
      token1,
    };
  } catch (error) {
    console.error('检查流动性失败:', error);
    return null;
  }
}
