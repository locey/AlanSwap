import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { WagmiProvider } from "wagmi";
import {
  mainnet,
  polygon,
  arbitrum,
  localhost,
  sepolia,
  goerli,
  bsc,
  bscTestnet,
  avalanche,
  avalancheFuji
} from "wagmi/chains";

const config = getDefaultConfig({
  appName: 'CryptoSwap',
  projectId: 'YOUR_PROJECT_ID', // 从 WalletConnect Cloud 获取
  chains: [
    mainnet,        // 以太坊主网
    sepolia,        // Sepolia 测试网
    goerli,         // Goerli 测试网
    polygon,        // Polygon 主网
    arbitrum,       // Arbitrum 主网
    bsc,            // BSC 主网
    bscTestnet,     // BSC 测试网
    avalanche,      // Avalanche 主网
    avalancheFuji,  // Avalanche 测试网
    localhost,      // 本地网络
  ],
  ssr: false,
});

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <App /> */}
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
