import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";


/***************************
* Part 1: ConnectWalletButton（支持主页面事件回调）
***************************/
const hasWindowEth = () => typeof window !== "undefined" && window.ethereum;
const truncate = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");


export default function ConnectWalletButton({
    isConnected,
    onConnect, // (ctx) => void ctx: { address, provider, chainId }
    onDisconnect, // () => void
    onAccountsChanged,// (ctx) => void ctx: { address|null, provider }
    onChainChanged, // (ctx) => void ctx: { chainId, provider }
    className = "",
}) {
    const [provider, setProvider] = useState(null);
    const [address, setAddress] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);


    // 初始化 provider 并尝试读取已有连接
    const load = useCallback(async () => {
        if (!hasWindowEth()) return;
        const eth = window.ethereum;
        setProvider(eth);
        try {
            const [accs, cId] = await Promise.all([
                eth.request({ method: "eth_accounts" }),
                eth.request({ method: "eth_chainId" }),
            ]);
            console.log('initial_wallet_btn: ', [accs, cId] )
            // setAddress(accs?.[0] || null);
            // setChainId(cId || null);
        } catch (e) {
            // no-op
        }
    }, []);


    useEffect(() => { load(); }, [load]);


    // 订阅事件
    useEffect(() => {
        if (!provider || !provider.on) return;
        const handleAccounts = (accs) => {
            const next = accs?.[0] || null;
            setAddress(next);
            onAccountsChanged && onAccountsChanged({ address: next, provider });
            if (!next) onDisconnect && onDisconnect();
        };
        const handleChain = (id) => {
            setChainId(id);
            onChainChanged && onChainChanged({ chainId: id, provider });
        };
        provider.on("accountsChanged", handleAccounts);
        provider.on("chainChanged", handleChain);
        return () => {
            provider.removeListener && provider.removeListener("accountsChanged", handleAccounts);
            provider.removeListener && provider.removeListener("chainChanged", handleChain);
        };
    }, [provider, onAccountsChanged, onChainChanged, onDisconnect]);


    const connect = async () => {
        setErr(null);
        if (!hasWindowEth()) { setErr("未检测到钱包，请安装 MetaMask 或使用内置钱包。"); return; }
        try {
            setBusy(true);
            const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
            const cId = await window.ethereum.request({ method: "eth_chainId" });
            const addr = accs?.[0] || null;
            setAddress(addr);
            setChainId(cId || null);
            onConnect && onConnect({ address: addr, provider: window.ethereum, chainId: cId });
        } catch (e) {
            setErr(e?.message || "连接失败");
        } finally { setBusy(false); }
    };


    const disconnect = () => {
        // 浏览器钱包多数不支持程序化断开，这里仅重置 UI 与向上汇报
        setAddress(null);
        onDisconnect && onDisconnect();
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {!address ? (
                <button onClick={connect} disabled={busy}
                className={`font-semibold px-2 py-1 rounded-2xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:-translate-y-1`}>连接钱包</button>
            ) : (
                <div className="flex items-center gap-2">
                    {isConnected && <span className='bg-green-500/20 text-green-400' title={address}>{truncate(address)}</span>}
                    <button onClick={disconnect} disabled={busy} className="px-3 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-sm hover:opacity-90 disabled:opacity-50 text-red-400">断开</button>
                    {isConnected && <span className='bg-green-500/20 text-green-400' title={chainId}>{chainId}</span>}
                </div>
            )}
            {err && <span className="text-xs text-red-500">{err}</span>}
        </div>
    );


}