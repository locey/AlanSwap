
// 空状态组件
const EmptyState = ({ icon, title, description, connectWallet, buttonText = "连接钱包" }) => (
<div className="bg-slate-800/60 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center mx-auto">
    <div className="text-5xl mb-6">{icon}</div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-gray-400 mb-8 leading-relaxed">{description}</p>
    <button
    onClick={connectWallet}
    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:-translate-y-1"
    >
    {buttonText}
    </button>
</div>
);
export default EmptyState