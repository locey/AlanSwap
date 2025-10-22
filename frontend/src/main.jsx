import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import {
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { WagmiProvider, http, createConfig } from "wagmi";
import { mainnet, polygon, arbitrum, localhost } from "wagmi/chains";

const config = createConfig({
  chains: [mainnet, polygon, arbitrum, localhost],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [localhost.id]: http("http://127.0.0.1:8545"),
  },
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
