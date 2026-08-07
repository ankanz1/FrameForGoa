import React from 'react';
import { Sparkles } from 'lucide-react';
import { BadgeDetails } from '../types';
import { getRandomBuilderTitle } from '../lib/builderTitle';

interface BadgeFormProps {
  details: BadgeDetails;
  onChange: (details: BadgeDetails) => void;
}

export const BadgeForm: React.FC<BadgeFormProps> = ({ details, onChange }) => {
  const updateField = (field: keyof BadgeDetails, value: string) => {
    onChange({
      ...details,
      [field]: value,
    });
  };

  const handleRerollTitle = () => {
    updateField('title', getRandomBuilderTitle());
  };

  return (
    <div className="bg-[#084f2b] rounded-2xl p-5 shadow-xl space-y-4">
      <h3 className="font-playfair text-xl font-bold text-[#fef6e4]">
        2. Builder Details
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-mono font-bold text-[#f3c048] mb-1">
            FULL NAME / ALIAS
          </label>
          <input
            type="text"
            placeholder="e.g. Satoshi Nakamoto"
            value={details.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full bg-[#08140e] border border-[#1b3d2c] rounded-xl px-3 py-2 text-[#fef6e4] text-sm focus:outline-none focus:border-[#f3c048] transition"
          />
        </div>

        {/* X Handle */}
        <div>
          <label className="block text-xs font-mono font-bold text-[#f3c048] mb-1">
            X / TWITTER HANDLE
          </label>
          <input
            type="text"
            placeholder="e.g. @satoshi"
            value={details.handle}
            onChange={(e) => updateField('handle', e.target.value)}
            className="w-full bg-[#08140e] border border-[#1b3d2c] rounded-xl px-3 py-2 text-[#fef6e4] text-sm focus:outline-none focus:border-[#f3c048] transition"
          />
        </div>

        {/* Track / Stack */}
        <div>
          <label className="block text-xs font-mono font-bold text-[#f3c048] mb-1">
            TRACK / TECH STACK
          </label>
          <select
            value={details.track}
            onChange={(e) => updateField('track', e.target.value)}
            className="w-full bg-[#08140e] border border-[#1b3d2c] rounded-xl px-3 py-2 text-[#fef6e4] text-sm focus:outline-none focus:border-[#f3c048] transition"
          >
            <option value="AI & Agents">AI & Agents</option>
            <option value="Full-Stack Web3">Full-Stack Web3</option>
            <option value="Zero Knowledge">Zero Knowledge & Crypto</option>
            <option value="DeFi & Infra">DeFi & Infrastructure</option>
            <option value="Consumer & Games">Consumer & Autonomous Games</option>
            <option value="Design & UX">Design & UX</option>
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-mono font-bold text-[#f3c048] mb-1">
            PRIMARY ROLE
          </label>
          <input
            type="text"
            placeholder="e.g. Hacker / Founder"
            value={details.role}
            onChange={(e) => updateField('role', e.target.value)}
            className="w-full bg-[#08140e] border border-[#1b3d2c] rounded-xl px-3 py-2 text-[#fef6e4] text-sm focus:outline-none focus:border-[#f3c048] transition"
          />
        </div>
      </div>

      {/* Project / Affiliation */}
      <div>
        <label className="block text-xs font-mono font-bold text-[#f3c048] mb-1">
          PROJECT / AFFILIATION
        </label>
        <input
          type="text"
          placeholder="e.g. Building Next-Gen AI Agents"
          value={details.company}
          onChange={(e) => updateField('company', e.target.value)}
          className="w-full bg-[#08140e] border border-[#1b3d2c] rounded-xl px-3 py-2 text-[#fef6e4] text-sm focus:outline-none focus:border-[#f3c048] transition"
        />
      </div>

      {/* Whimsical Builder Title */}
      <div className="bg-[#08140e] p-3.5 rounded-xl border border-[#1d4230]">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-mono font-bold text-[#ff2d75] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ff2d75]" />
            GOA BUILDER TITLE
          </label>
          <button
            type="button"
            onClick={handleRerollTitle}
            className="text-xs text-[#f3c048] hover:underline flex items-center gap-1 font-mono cursor-pointer"
          >
            🎲 Reroll Title
          </button>
        </div>

        <input
          type="text"
          value={details.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full bg-[#0f241a] border border-[#22503a] rounded-lg px-3 py-2 text-[#ff2d75] font-mono text-sm font-semibold focus:outline-none focus:border-[#ff2d75]"
        />
      </div>
    </div>
  );
};
