import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "./useWallet";
import { ethers } from "ethers";


/***************************
* Part 1: ConnectWalletButton（支持主页面事件回调）
***************************/
const hasWindowEth = () => typeof window !== "undefined" && window.ethereum;
const truncate = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

export default function ConnectWalletButton() {
    const { walletConnected, setWalletConnected, address, chainId, setAddress, setChainId } = useWallet();
    const [provider, setProvider] = useState(null);
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
            console.log('initial_wallet_btn: ', [accs, cId])
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
            console.warn('accountChangedddd: ', { address: next, provider });
            if (!next) {
                console.warn('disconnecttttt')
            }
        };
        const handleChain = (id) => {
            setChainId(id);
            console.warn('chainChangedddd: ', { chainId: id, provider });
        };
        provider.on("accountsChanged", handleAccounts);
        provider.on("chainChanged", handleChain);
        return () => {
            provider.removeListener && provider.removeListener("accountsChanged", handleAccounts);
            provider.removeListener && provider.removeListener("chainChanged", handleChain);
        };
    }, [provider]);


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
            // 一键登录：签名 nonce -> 提交 verify -> 获得 JWT
            if (addr) {
                // 调用后端接口获取 nonce
                try {
                    // setWalletConnected(true)        //TODO---调试需要可放开,生产请删除---yuyue3
                    const res = await fetchNonce(addr);
                    const nonce = res.data.nonce;
                    // 使用 ethers.providers 对 nonce 消息进行签名
                    const eprovider = new ethers.BrowserProvider(window.ethereum);
                    await eprovider.send('eth_requestAccounts', [])
                    const signer = await eprovider.getSigner();
                    const signature = await signer.signMessage(nonce);
                    //
                    const vr = await verifySignature({ nonce, addr, signature });
                    console.log('vr: ', vr)
                    if (vr.msg !== "OK") throw new Error("未获得 token");
                    console.log(`已连接：${addr.slice(0, 6)}…${addr.slice(-4)} @ ${cId}`);
                    // TODO: 在此触发你的首页数据加载，如余额、池子列表等
                    setWalletConnected(true);
                } catch (e) {
                    console.error("失败: ", e);
                }
            } else {
                setWalletConnected(false);
            }
        } catch (e) {
            setErr(e?.message || "连接失败");
        } finally { setBusy(false); }
    };

    // 调用后端接口获取 nonce 的方法
    async function fetchNonce(address) {
        try {
            const url = `https://8bffa73e18a7.ngrok-free.app/api/v1/auth/nonce/?address=${address}`;
            const res = await fetch(url, { method: "GET" });
            if (!res.ok) throw new Error("请求失败: " + res.status);
            const data = await res.json();
            console.log("Nonce 响应:", data);
            return data;
        } catch (e) {
            console.error("获取 nonce 出错:", e);
            throw e;
        }
    }

    // 调用后端「签名验证」接口，换取 JWT
    async function verifySignature({ nonce, address, signature }) {
        try {
            const res = await fetch("https://8bffa73e18a7.ngrok-free.app/api/v1/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nonce, address, signature }),
            });
            if (!res.ok) throw new Error(`验证失败: ${res.status}`);
            const data = await res.json();
            console.log("Verify 响应:", data);
            return data; // 期望含 { token: "JWT..." }
        } catch (e) {
            console.error("签名验证出错:", e);
            throw e;
        }
    }


    const disconnect = () => {
        // 浏览器钱包多数不支持程序化断开，这里仅重置 UI 与向上汇报
        setAddress(null);
        setWalletConnected(false);
        console.warn('dsiconnectttttt!')
    };

    return (
        <div className={`flex items-center gap-2`}>
            {!walletConnected ? (
                <button onClick={connect} disabled={busy}
                    className={`font-semibold px-2 py-1 rounded-2xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:-translate-y-1`}>连接钱包</button>
            ) : (
                <div className="flex items-center gap-2">
                    {address && <span className='bg-green-500/20 text-green-400' title={address}>{truncate(address)}</span>}
                    <button onClick={disconnect} disabled={busy} className="px-3 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-sm hover:opacity-90 disabled:opacity-50 text-red-400">断开</button>
                    {chainId && <span className='bg-green-500/20 text-green-400' title={chainId}>{chainId}</span>}
                </div>
            )}
            {err && <span className="text-xs text-red-500">{err}</span>}
        </div>
    );


}