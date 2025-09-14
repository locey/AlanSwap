import { ethers } from "ethers";

// 1) 检查并切到 Sepolia
export async function ensureSepolia() {
  const eth = window.ethereum;
  if (!eth) throw new Error("未检测到钱包");
  const chainId = await eth.request({ method: "eth_chainId" });
  if (chainId?.toLowerCase() === "0xaa36a7") return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });
  } catch (e) {
    if (e.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0xaa36a7",
          chainName: "Sepolia Test Network",
          rpcUrls: ["https://rpc.sepolia.org"],
          nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        }],
      });
    } else {
      throw e;
    }
  }
}

// 2) 构造合约对象
export async function getContract({ address, abi }) {
  await ensureSepolia();
  const provider = new ethers.BrowserProvider(window.ethereum); // 基于已连接的钱包
  const signer = await provider.getSigner();                     // 用户签名身份
  return new ethers.Contract(address, abi, signer);
}

// 3) 读方法（不需 signer 也行，这里统一用 signer 便于写）
export async function readContract({ address, abi, functionName, args = [] }) {
  const c = await getContract({ address, abi });
  return await c[functionName](...args);
}

// 4) 写方法（会弹出钱包）
export async function writeContract({ address, abi, functionName, args = [], valueEth }) {
  const c = await getContract({ address, abi });
  // 可选：预估 gas
  // const gas = await c[functionName].estimateGas(...args, valueEth ? { value: ethers.parseEther(String(valueEth)) } : {});
  const tx = await c[functionName](...args, valueEth ? { value: ethers.parseEther(String(valueEth)) } : {});
  const receipt = await tx.wait(); // 等待上链
  return { hash: tx.hash, receipt };
}
