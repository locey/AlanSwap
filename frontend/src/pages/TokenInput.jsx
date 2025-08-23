
// 代币选择组件
const TokenSelect = ({ token, onClick, balance }) => (
  <div
    onClick={onClick}
    className="flex items-center bg-white/10 rounded-2xl px-4 py-2 cursor-pointer hover:bg-white/20 transition-all duration-200 hover:scale-105"
  >
    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 mr-2"></div>
    <span className="font-semibold mr-2">{token}</span>
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);
  
  
// 输入组件
const TokenInput = ({ label, value, onChange, token, onTokenClick, balance, disabled = false }) => (
  <div className="bg-black/30 border border-white/10 rounded-2xl p-5 hover:border-blue-500/50 transition-all duration-200">
    <div className="text-sm text-gray-400 mb-2">{label}</div>
    <div className="flex justify-between items-center mb-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.0"
        disabled={disabled}
        className="bg-transparent text-2xl font-semibold text-white outline-none flex-1 mr-4"
      />
      <TokenSelect token={token} onClick={onTokenClick} />
    </div>
    <div className="text-xs text-gray-500">余额: {balance}</div>
  </div>
);

export default TokenInput