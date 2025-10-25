import {create} from 'zustand'

export const useWallet = create((set, get) => ({
    walletConnected: false,
    setWalletConnected: (status) => set({ walletConnected: status }),
    getWalletConnected: ()=> get().walletConnected,
    // 全局钱包状态：address / chainId / jwt
    address: null,
    chainId: null,
    jwt: null,
    // setters
    setAddress: (address) => set({ address }),
    setChainId: (chainId) => set({ chainId }),
    setJwt: (jwt) => set({ jwt }),
    reset: () => set({ address: null, chainId: null, jwt: null }),
    getWallet: ()=> {
        const { address, chainId, jwt } = get();
        return { address, chainId, jwt };
    }

}))

// export const useWallet = create((set, get) => ({
//     address: null,
// }))