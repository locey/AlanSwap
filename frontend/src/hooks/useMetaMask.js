import { BrowserProvider } from "ethers"; // ethers v6
import { useState, useEffect } from "react";

export default function useMetaMask() {
  const [signer, setSigner] = useState(undefined);
  const [address, setAddress] = useState("");

  // 1. 连接钱包
  const connect = async () => {
    if (!window.ethereum) {
      alert("请安装 MetaMask");
      return;
    }
    // 请求授权
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    // 2. 构造 BrowserProvider（v6 写法）
    const provider = new BrowserProvider(window.ethereum);
    // 3. 取出 signer
    const s = await provider.getSigner();
    setSigner(s);
    setAddress(accounts[0]);
  };

  // 自动连接（可选）
  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      connect();
    }
  }, []);

  return { signer, address, connect };
}