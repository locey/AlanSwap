/**
 * 合约实例化 Hook
 * 提供方便的方式来获取合约实例
 */

import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWalletClient, usePublicClient } from 'wagmi';

// 导入合约 ABI
import RouterABI from '../contracts/abis/Router.json';
import ERC20ABI from '../contracts/abis/ERC20.json';
import PairABI from '../contracts/abis/Pair.json';

// 导入合约地址
import { getAddressesByChainId } from '../contracts/addresses';

/**
 * 将 Viem WalletClient 转换为 ethers Signer
 */
async function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.BrowserProvider(transport, network);
  const signer = await provider.getSigner(account.address);
  return signer;
}

/**
 * 将 Viem PublicClient 转换为 ethers Provider
 */
function publicClientToProvider(publicClient) {
  const { chain, transport } = publicClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.BrowserProvider(transport, network);
  return provider;
}

/**
 * 通用合约 Hook
 * @param {string} address - 合约地址
 * @param {Array} abi - 合约 ABI
 * @param {boolean} withSigner - 是否需要签名器（用于写操作）
 * @returns {ethers.Contract|null} 合约实例
 */
export const useContract = (address, abi, withSigner = false) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  return useMemo(() => {
    if (!address || !abi) return null;

    try {
      if (withSigner && walletClient) {
        // 对于需要签名的操作，返回一个 Promise
        return walletClientToSigner(walletClient).then(signer =>
          new ethers.Contract(address, abi, signer)
        );
      }

      if (publicClient) {
        const provider = publicClientToProvider(publicClient);
        return new ethers.Contract(address, abi, provider);
      }

      return null;
    } catch (error) {
      console.error('创建合约实例失败:', error);
      return null;
    }
  }, [address, abi, withSigner, walletClient, publicClient]);
};

/**
 * Router 合约 Hook
 * @param {boolean} withSigner - 是否需要签名器
 * @returns {ethers.Contract|null} Router 合约实例
 */
export const useRouterContract = (withSigner = false) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const chainId = publicClient?.chain?.id || 1;
  const addresses = getAddressesByChainId(chainId);

  return useContract(addresses.ROUTER, RouterABI, withSigner);
};

/**
 * ERC20 合约 Hook
 * @param {string} tokenAddress - 代币地址
 * @param {boolean} withSigner - 是否需要签名器
 * @returns {ethers.Contract|null} ERC20 合约实例
 */
export const useERC20Contract = (tokenAddress, withSigner = false) => {
  return useContract(tokenAddress, ERC20ABI, withSigner);
};

/**
 * Pair 合约 Hook
 * @param {string} pairAddress - 流动性对地址
 * @param {boolean} withSigner - 是否需要签名器
 * @returns {ethers.Contract|null} Pair 合约实例
 */
export const usePairContract = (pairAddress, withSigner = false) => {
  return useContract(pairAddress, PairABI, withSigner);
};

/**
 * 批量获取 ERC20 合约实例
 * @param {string[]} tokenAddresses - 代币地址数组
 * @param {boolean} withSigner - 是否需要签名器
 * @returns {ethers.Contract[]} 合约实例数组
 */
export const useMultipleERC20Contracts = (tokenAddresses = [], withSigner = false) => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  return useMemo(() => {
    if (!tokenAddresses.length) return [];

    try {
      if (withSigner && walletClient) {
        // 返回 Promise 数组
        const contracts = tokenAddresses.map(async (address) => {
          if (!address) return null;
          const signer = await walletClientToSigner(walletClient);
          return new ethers.Contract(address, ERC20ABI, signer);
        });
        return Promise.all(contracts);
      }

      if (publicClient) {
        const provider = publicClientToProvider(publicClient);
        const contracts = tokenAddresses.map((address) => {
          if (!address) return null;
          return new ethers.Contract(address, ERC20ABI, provider);
        });
        return contracts.filter(Boolean);
      }

      return [];
    } catch (error) {
      console.error('批量创建合约实例失败:', error);
      return [];
    }
  }, [tokenAddresses, withSigner, walletClient, publicClient]);
};

/**
 * 获取合约地址配置
 * @returns {object} 合约地址配置
 */
export const useContractAddresses = () => {
  const publicClient = usePublicClient();
  const chainId = publicClient?.chain?.id || 1;

  return useMemo(() => {
    return getAddressesByChainId(chainId);
  }, [chainId]);
};

export default {
  useContract,
  useRouterContract,
  useERC20Contract,
  usePairContract,
  useMultipleERC20Contracts,
  useContractAddresses,
};
