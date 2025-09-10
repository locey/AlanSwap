
import React, { useState, useEffect } from 'react';

const BackgroundStars = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // 生成初始粒子
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 1 + 0.5,
          delay: Math.random() * 5,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes float-up {
            0% {
              transform: translateY(0) translateX(0) scale(1);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100vh) translateX(20px) scale(0.5);
              opacity: 0;
            }
          }
          
          .animate-float-up {
            animation: float-up linear infinite;
          }
        `}
      </style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white animate-float-up"
            style={{
              left: `${particle.x}%`,
              bottom: '-10px',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDuration: `${15 / particle.speed}s`,
              animationDelay: `${particle.delay}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite'
            }}
          />
        ))}
      </div>
    </>
  );
};

export default BackgroundStars