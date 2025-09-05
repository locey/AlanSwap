// 通用：霓虹发光的卡片壳
const GlowCard = ({
    className = "",
    children,
    ...rest
  }) => (
    <div
      className={
        "relative rounded-2xl p-[1px] " +
        "bg-gradient-to-br from-cyan-400/20 via-fuchsia-400/10 to-indigo-400/20 hover:glow-purple transition-all duration-300 transform hover:scale-105 " +
        className
      }
      {...rest}
    >
      <div className="rounded-2xl bg-purple-900 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_rgba(93,0,255,0.15)]">
        {children}
      </div>
    </div>
);

export default GlowCard;