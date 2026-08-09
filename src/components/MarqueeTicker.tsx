import React from 'react';
import { Sparkles, Palmtree, Zap, Coffee } from 'lucide-react';

export function MarqueeTicker() {
  const items = [
    { text: '7 DAYS OF HACKING', icon: Zap },
    { text: 'BEACHFRONT VILLA', icon: Palmtree },
    { text: 'UNLIMITED FILTER COFFEE', icon: Coffee },
    { text: 'AUTONOMOUS AGENTS', icon: Sparkles },
    { text: 'PRIZE POOL $50K+', icon: Zap },
  ];

  // Duplicate items for seamless loop
  const tickerItems = [...items, ...items, ...items];

  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 bg-[#f6c81a] py-3 overflow-hidden border-y-2 border-[#1b3d2c] shadow-[0_0_20px_rgba(246,200,26,0.3)] z-20">
      <div className="flex w-[200%] animate-[marquee_20s_linear_infinite]">
        {tickerItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3 px-6 whitespace-nowrap">
              <Icon className="w-5 h-5 text-[#0b6839]" />
              <span className="font-mono text-sm sm:text-base font-bold text-[#0b6839] tracking-widest uppercase">
                {item.text}
              </span>
              <span className="text-[#0b6839]/30 mx-4">•</span>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
