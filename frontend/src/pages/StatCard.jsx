// 统计卡片组件
const StatCard = ({ title, value, change, gradient = "from-cyan-500 to-blue-600" }) => (
  <div className="bg-card text-card-foreground   border border-white/10 rounded-xl p-6  shadow-lg  
           backdrop-blur-[10px]
           bg-white/5
           border
           border-white/10
           shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)];   ">
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