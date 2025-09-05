// 通用：按钮
const NButton = ({ children, className = "", variant = "primary", size = "md", iconLeft }) => {
    const base =
      "inline-flex items-center justify-center rounded-xl font-medium transition-all select-none";
    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-4 text-sm",
      lg: "h-12 px-5 text-base",
    }[size];
    const variants = {
      primary:
        "bg-gradient-to-r from-[#5f5af7] via-[#7c3aed] to-[#a855f7] hover:opacity-95 text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]",
      ghost:
        "bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-inner",
      outline:
        "border border-white/20 text-white hover:bg-white/5",
    }[variant];
    return (
      <button className={`${base} ${sizes} ${variants} ${className}`}>
        {iconLeft && <span className="mr-2">{iconLeft}</span>}
        {children}
      </button>
    );
};

export default NButton;