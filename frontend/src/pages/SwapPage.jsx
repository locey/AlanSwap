import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function SwapPage({ walletConnected }) {
    const [exchangeRate, setExchangeRate] = useState(1250.00);
    const [slippage, setSlippage] = useState('0.5');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [fromToken, setFromToken] = useState('ETH');
    const [toToken, setToToken] = useState('USDC');
    const tokens = [
        { symbol: 'ETH', name: 'Ethereum', balance: 12.345, icon: '🔹' },
        { symbol: 'WBTC', name: 'Bitcoin', balance: 0.5678, icon: '₿' },
        { symbol: 'USDC', name: 'USD Coin', balance: 1250.00, icon: '💵' },
        { symbol: 'USDT', name: 'Tether', balance: 500.00, icon: '💰' }
    ];

    const getTokenData = (symbol) => {
        return tokens.find(token => token.symbol === symbol);
    };
    const handleFromAmountChange = (value) => {
        setFromAmount(value);
        if (value && !isNaN(value)) {
            const calculated = fromToken === 'ETH' ?
                (parseFloat(value) * exchangeRate).toFixed(2) :
                (parseFloat(value) / exchangeRate).toFixed(6);
            setToAmount(calculated);
        } else {
            setToAmount('');
        }
    };
    const handleSwapTokens = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setFromAmount(toAmount);
        setToAmount(fromAmount);
    };

    // 实时汇率计算
    useEffect(() => {
        if (fromAmount && fromToken && toToken) {
            const rate = fromToken === 'ETH' ? 2845.32 : 1 / 2845.32;
            const result = (parseFloat(fromAmount) * rate).toFixed(2);
            setToAmount(result);
        } else {
            setToAmount('');
        }
    }, [fromAmount, fromToken, toToken]);
    return (

        <div className="w-full max-w-md mx-auto">
            {/* 交换卡片 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl animate-scale-in">
                {/* 标题和设置 */}
                <div className="flex items-center justify-between mb-6">
                    <div data-slot="card-title" className="text-xl font-bold neon-text-enhanced">交换</div>
                    <span className="text-sm text-black rounded-lg px-1 bg-slate-700/50 hover:bg-slate-700/70 transition-all">最优路径</span>
                </div>

                {/* 从 Token */}
                <div className="relative mb-4">
                    <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">从</span>
                            <span className="text-sm text-slate-400">
                                余额: {getTokenData(fromToken)?.balance.toFixed(fromToken === 'ETH' ? 3 : 2)} {fromToken}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={fromToken}
                                onChange={(e) => setFromToken(e.target.value)}
                                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {tokens.map(token => (
                                    <option key={token.symbol} value={token.symbol}>
                                        {token.icon} {token.symbol}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={fromAmount}
                                onChange={(e) => handleFromAmountChange(e.target.value)}
                                placeholder="0.0"
                                className="flex-1 bg-gray-700 py-1 rounded-xl text-white text-right text-xl font-semibold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 交换按钮 */}
                <div className="flex justify-center mb-4 relative">
                    <button
                        onClick={handleSwapTokens}
                        className="bg-slate-700/50 hover:bg-slate-600/50 p-3 rounded-full border border-slate-600/30 transition-all hover:scale-110"
                    >
                        <ArrowUpDown className="w-5 h-5 text-slate-300" />
                    </button>
                </div>

                {/* 到 Token */}
                <div className="relative mb-6">
                    <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">到</span>
                            <span className="text-sm text-slate-400">
                                余额: {getTokenData(toToken)?.balance.toFixed(toToken === 'USDC' ? 2 : 6)} {toToken}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={toToken}
                                onChange={(e) => setToToken(e.target.value)}
                                className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {tokens.map(token => (
                                    <option key={token.symbol} value={token.symbol}>
                                        {token.icon} {token.symbol}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={toAmount}
                                readOnly
                                placeholder="0.0"
                                className="flex-1 bg-gray-700 py-1 rounded-xl text-white text-right text-xl font-semibold focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 交换信息 */}
                {fromAmount && (<div className="bg-slate-800/30 rounded-xl p-4 mb-6 border border-slate-700/20">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">汇率</span>
                        <span className="text-white">1 {fromToken} ≈ {exchangeRate.toLocaleString()} {toToken}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">滑点</span>
                        <span className="text-white">{slippage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">手续费</span>
                        <span className="text-white">~0.003 ETH</span>
                    </div>
                </div>)}

                {/* 交换按钮 */}
                <button
                    disabled={!walletConnected || !fromAmount || parseFloat(fromAmount) === 0}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed"
                >
                    {!walletConnected ? '请先连接钱包' : (!fromAmount || parseFloat(fromAmount) === 0 ? '输入金额' : '交换')}
                </button>
            </div>

            {/* 市场趋势卡片 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl mt-6 animate-scale-in">
                <h3 className="text-lg font-semibold text-white mb-4">市场概览</h3>
                <div className="grid grid-cols-2 gap-4">
                    {tokens.slice(0, 4).map((token, index) => (
                        <div key={token.symbol} className="bg-slate-800/50 rounded-lg p-3 duration-300 card-cyber transition-all animate-float-slow" style={{ animationDelay: `${0.5 * index}s`, }}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{token.icon}</span>
                                <span className="text-sm font-medium text-white">{token.symbol}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{token.name}</span>
                                <span className="text-sm font-semibold text-green-400">+2.34%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}