import React, { useEffect, useState } from "react";

const Spin = ({
  children,
  spinning = true,
  tip,
  size = "default",
  indicator,
  wrapperClassName = "",
  delay = 0,
}) => {
  const [showSpinner, setShowSpinner] = useState(!delay ? spinning : false);

  // 处理延迟显示
  useEffect(() => {
    let timer;
    if (!spinning) {
      // 如果不加载，立即隐藏
      setShowSpinner(false);
    } else if (delay) {
      // 如果加载且有延迟，先隐藏，延迟后显示
      setShowSpinner(false);
      timer = setTimeout(() => {
        setShowSpinner(true);
      }, delay);
    } else {
      // 如果加载且没有延迟，立即显示
      setShowSpinner(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [spinning, delay]);

  // 尺寸配置
  const sizeConfig = {
    small: {
      spinner: "h-4 w-4 border-2",
      tip: "text-xs",
    },
    default: {
      spinner: "h-8 w-8 border-2",
      tip: "text-sm",
    },
    large: {
      spinner: "h-12 w-12 border-4",
      tip: "text-base",
    },
  };

  // 默认旋转指示器 - 使用霓虹色
  const defaultIndicator = (
    <div
      className={`${sizeConfig[size].spinner} border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin`}
      style={{
        boxShadow: "0 0 10px rgba(34, 211, 238, 0.5)",
      }}
    />
  );

  // 如果没有子元素，只显示加载指示器
  if (!children) {
    if (!spinning) {
      return null;
    }
    return (
      <div className="inline-flex flex-col items-center justify-center">
        {showSpinner && (
          <>
            <div className="inline-block">{indicator || defaultIndicator}</div>
            {tip && (
              <div className={`mt-2 neon-text-white ${sizeConfig[size].tip}`}>
                {tip}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // 有子元素时的包裹模式
  return (
    <div className={`relative ${wrapperClassName}`}>
      {/* 内容区域 */}
      <div className={spinning ? "opacity-50 pointer-events-none" : ""}>
        {children}
      </div>

      {/* 加载遮罩层 - 使用深色渐变背景，符合 RewardsPage 样式 */}
      {showSpinner && spinning && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-400/10 via-fuchsia-400/5 to-indigo-400/10 backdrop-blur-sm z-10 rounded-2xl">
          <div className="flex flex-col items-center">
            <div className="inline-block">{indicator || defaultIndicator}</div>
            {tip && (
              <div className={`mt-2 neon-text-white ${sizeConfig[size].tip}`}>
                {tip}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Spin;
