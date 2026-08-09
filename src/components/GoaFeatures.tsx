import React from 'react';
import { Wifi, Waves, Zap, Flame } from 'lucide-react';

export function GoaFeatures() {
  const features = [
    {
      icon: Waves,
      title: 'Ocean Views',
      desc: 'Hack from a beachfront villa with uninterrupted views of the Arabian Sea.',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20'
    },
    {
      icon: Wifi,
      title: 'Fiber Internet',
      desc: 'Dedicated enterprise-grade fiber connection. No lag, just pure shipping.',
      color: 'text-[#f6c81a]',
      bg: 'bg-[#f6c81a]/10',
      border: 'border-[#f6c81a]/20'
    },
    {
      icon: Flame,
      title: 'Agentic Tools',
      desc: 'Build the future of autonomous systems alongside top founders & researchers.',
      color: 'text-[#ff2e8f]',
      bg: 'bg-[#ff2e8f]/10',
      border: 'border-[#ff2e8f]/20'
    },
    {
      icon: Zap,
      title: '24/7 Energy',
      desc: 'Unlimited filter coffee, local cuisine, and late-night brainstorming sessions.',
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20'
    }
  ];

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-playfair text-3xl md:text-5xl font-bold text-[#fef6e4] mb-4">
          Why <span className="text-[#ff2e8f] italic">Goa?</span>
        </h2>
        <p className="font-mono text-[#cbd5e1] max-w-2xl mx-auto">
          We combined the ultimate tropical destination with the ultimate hacker environment. 
          The result is unparalleled deep work and creativity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div 
              key={idx} 
              className={`p-6 rounded-2xl border ${feat.border} bg-[#084f2b]/40 backdrop-blur-sm hover:bg-[#084f2b]/80 transition duration-300 group`}
            >
              <div className={`w-12 h-12 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#fef6e4] mb-2">{feat.title}</h3>
              <p className="font-body-text text-sm text-[#cbd5e1]/80 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
