/**
 * 代币余额查询 Hook
 * 用于查询用户的代币余额和授权额度
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useERC20Contract } from './useContract';
import { formatTokenAmount } from '../utils/web3';

/**
 * 查询单个代币余额
 * @param {string} tokenAddress - 代币地址
 * @returns {object} 余额信息
 */
export const useTokenBalance = (tokenAddress) => {
  const { address: account } = useAccount();
  const contract = useERC20Contract(tokenAddress, false);

  const [balance, setBalance] = useState('0');
  const [formattedBalance, setFormattedBalance] = useState('0');
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!contract || !account || !tokenAddress) {
      setBalance('0');
      setFormattedBalance('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 并行查询余额、小数位和符号
      const [balanceResult, decimalsResult, symbolResult] = await Promise.all([
        contract.balanceOf(account),
        contract.decimals().catch(() => 18),
        contract.symbol().catch(() => 'TOKEN'),
      ]);

      const balanceStr = balanceResult.toString();
      const decimalsNum = Number(decimalsResult);

      setBalance(balanceStr);
      setDecimals(decimalsNum);
      setSymbol(symbolResult);
      setFormattedBalance(formatTokenAmount(balanceStr, decimalsNum));
    } catch (err) {
      console.error('查询代币余额失败:', err);
      setError(err.message);
      setBalance('0');
      setFormattedBalance('0');
    } finally {
      setLoading(false);
    }
  }, [contract, account, tokenAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    formattedBalance,
    decimals,
    symbol,
    loading,
    error,
    refetch: fetchBalance,
  };
};

/**
 * 查询 ETH 余额
 * @returns {object} ETH 余额信息
 */
export const useETHBalance = () => {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();

  const [balance, setBalance] = useState('0');
  const [formattedBalance, setFormattedBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!publicClient || !account) {
      setBalance('0');
      setFormattedBalance('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balanceResult = await publicClient.getBalance({ address: account });
      const balanceStr = balanceResult.toString();

      setBalance(balanceStr);
      setFormattedBalance(formatTokenAmount(balanceStr, 18));
    } catch (err) {
      console.error('查询 ETH 余额失败:', err);
      setError(err.message);
      setBalance('0');
      setFormattedBalance('0');
    } finally {
      setLoading(false);
    }
  }, [publicClient, account]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    formattedBalance,
    decimals: 18,
    symbol: 'ETH',
    loading,
    error,
    refetch: fetchBalance,
  };
};

/**
 * 查询多个代币余额
 * @param {string[]} tokenAddresses - 代币地址数组
 * @returns {object} 多个代币的余额信息
 */
export const useMultipleTokenBalances = (tokenAddresses = []) => {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();

  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = useCallback(async () => {
    if (!publicClient || !account || !tokenAddresses.length) {
      setBalances({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const balancePromises = tokenAddresses.map(async (address) => {
        if (!address) return null;

        try {
          // 使用 ethers 合约查询
          const { ethers } = await import('ethers');
          const ERC20ABI = (await import('../contracts/abis/ERC20.json')).default;

          const provider = new ethers.BrowserProvider(publicClient.transport);
          const contract = new ethers.Contract(address, ERC20ABI, provider);

          const [balance, decimals, symbol] = await Promise.all([
            contract.balanceOf(account),
            contract.decimals().catch(() => 18),
            contract.symbol().catch(() => 'TOKEN'),
          ]);

          const balanceStr = balance.toString();
          const decimalsNum = Number(decimals);

          return {
            address,
            balance: balanceStr,
            formattedBalance: formatTokenAmount(balanceStr, decimalsNum),
            decimals: decimalsNum,
            symbol,
          };
        } catch (err) {
          console.error(`查询代币 ${address} 余额失败:`, err);
          return {
            address,
            balance: '0',
            formattedBalance: '0',
            decimals: 18,
            symbol: 'TOKEN',
          };
        }
      });

      const results = await Promise.all(balancePromises);
      const balancesMap = {};

      results.forEach((result) => {
        if (result) {
          balancesMap[result.address] = result;
        }
      });

      setBalances(balancesMap);
    } catch (err) {
      console.error('批量查询代币余额失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [publicClient, account, tokenAddresses]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
  };
};

/**
 * 查询代币授权额度
 * @param {string} tokenAddress - 代币地址
 * @param {string} spenderAddress - 被授权地址（如 Router 地址）
 * @returns {object} 授权额度信息
 */
export const useTokenAllowance = (tokenAddress, spenderAddress) => {
  const { address: account } = useAccount();
  const contract = useERC20Contract(tokenAddress, false);

  const [allowance, setAllowance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllowance = useCallback(async () => {
    if (!contract || !account || !spenderAddress) {
      setAllowance('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allowanceResult = await contract.allowance(account, spenderAddress);
      setAllowance(allowanceResult.toString());
    } catch (err) {
      console.error('查询授权额度失败:', err);
      setError(err.message);
      setAllowance('0');
    } finally {
      setLoading(false);
    }
  }, [contract, account, spenderAddress]);

  useEffect(() => {
    fetchAllowance();
  }, [fetchAllowance]);

  return {
    allowance,
    loading,
    error,
    refetch: fetchAllowance,
  };
};

/**
 * 查询代币详细信息
 * @param {string} tokenAddress - 代币地址
 * @returns {object} 代币信息
 */
export const useTokenInfo = (tokenAddress) => {
  const contract = useERC20Contract(tokenAddress, false);

  const [tokenInfo, setTokenInfo] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    totalSupply: '0',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTokenInfo = useCallback(async () => {
    if (!contract || !tokenAddress) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name().catch(() => 'Unknown'),
        contract.symbol().catch(() => 'TOKEN'),
        contract.decimals().catch(() => 18),
        contract.totalSupply().catch(() => '0'),
      ]);

      setTokenInfo({
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
      });
    } catch (err) {
      console.error('查询代币信息失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contract, tokenAddress]);

  useEffect(() => {
    fetchTokenInfo();
  }, [fetchTokenInfo]);

  return {
    tokenInfo,
    loading,
    error,
    refetch: fetchTokenInfo,
  };
};

export default {
  useTokenBalance,
  useETHBalance,
  useMultipleTokenBalances,
  useTokenAllowance,
  useTokenInfo,
};
