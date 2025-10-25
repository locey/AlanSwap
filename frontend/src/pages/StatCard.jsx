// 统计卡片组件
const StatCard = ({ title, value, change, gradient = "from-cyan-500 to-blue-600" }) => (
    <div className="bg-slate-800/60 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:transform hover:-translate-y-2 transition-all duration-300 hover:border-blue-500/50">
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className={`text-2xl font-bold mb-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {typeof value === 'number' ? 
          (title.includes('$') || title.includes('价值') ? `$${value.toLocaleString()}` : 
           title.includes('%') ? `${value}%` : 
           value.toLocaleString()) : value}
      </div>
      <div className="text-xs text-green-400">{change}</div>
    </div>
  );

export default StatCard