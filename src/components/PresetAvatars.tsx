import React from 'react';
import { Sparkles } from 'lucide-react';

interface PresetAvatarsProps {
  onSelectPreset: (dataUrl: string) => void;
}

// SVG data URLs for sample builder avatars
const PRESETS = [
  {
    name: 'Goa Hacker',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%231a382b"/><path d="M200 120 a60 60 0 1 0 0.1 0 Z" fill="%23f3c048"/><path d="M120 320 c0 -80 40 -100 80 -100 s80 20 80 100 Z" fill="%23f3c048"/><circle cx="180" cy="110" r="8" fill="%2308140e"/><circle cx="220" cy="110" r="8" fill="%2308140e"/><path d="M185 140 Q200 155 215 140" stroke="%2308140e" stroke-width="4" fill="none"/></svg>',
  },
  {
    name: 'Cyber Palm',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%230c2217"/><circle cx="200" cy="200" r="120" fill="%23ff2d75"/><path d="M200 280 L200 160 Q240 120 280 140 M200 180 Q150 140 120 170 M200 200 Q260 170 290 200" stroke="%23f3c048" stroke-width="8" fill="none"/></svg>',
  },
  {
    name: 'AI Agent',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23122b1e"/><rect x="120" y="120" width="160" height="160" rx="30" fill="%23f3c048"/><circle cx="165" cy="180" r="16" fill="%2308140e"/><circle cx="235" cy="180" r="16" fill="%2308140e"/><line x1="160" y1="230" x2="240" y2="230" stroke="%2308140e" stroke-width="8" stroke-linecap="round"/></svg>',
  },
];

export const PresetAvatars: React.FC<PresetAvatarsProps> = ({ onSelectPreset }) => {
  return (
    <div className="bg-[#084f2b] rounded-2xl p-4 shadow-xl mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#f3c048]" />
        <span className="text-xs font-mono font-bold text-[#fef6e4] uppercase tracking-wider">
          Or try a sample avatar:
        </span>
      </div>

      <div className="flex items-center gap-3">
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPreset(p.url)}
            className="group relative flex-1 bg-[#08140e] border border-[#1b3d2c] hover:border-[#f3c048] rounded-xl p-2 transition text-center cursor-pointer"
          >
            <img
              src={p.url}
              alt={p.name}
              className="w-12 h-12 rounded-lg mx-auto mb-1 border border-[#22503a] group-hover:scale-105 transition"
            />
            <span className="block text-[11px] font-medium text-[#94a3b8] group-hover:text-[#fef6e4]">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
