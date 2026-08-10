import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { BadgeDetails } from '../types';
import { generateBuilderTitle } from '../lib/builderTitle';

interface BadgeFormProps {
  details: BadgeDetails;
  onChange: (details: BadgeDetails) => void;
}

export const BadgeForm: React.FC<BadgeFormProps> = ({ details, onChange }) => {
  const [titleSeed, setTitleSeed] = useState(0);

  const updateField = (field: keyof BadgeDetails, value: string) => {
    onChange({
      ...details,
      [field]: value,
    });
  };

  // Auto-generate a whimsical title from name + role (reroll bumps the seed).
  // Only once the user has filled in a name AND role.
  useEffect(() => {
    if (!details.name || !details.role) return;
    updateField(
      'title',
      generateBuilderTitle(details.name, details.role, titleSeed)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details.name, details.role, titleSeed]);

  const handleRerollTitle = () => {
    setTitleSeed((s) => s + 1);
  };

  return (
    <div className="bg-[var(--hh-green)] rounded-2xl p-5 shadow-xl space-y-4">
      <h3 className="font-playfair text-xl font-bold text-[var(--hh-cream)]">
        2. Builder Details
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-mono font-bold text-[var(--hh-gold)] mb-1">
            FULL NAME / ALIAS
          </label>
          <input
            type="text"
            placeholder="e.g. Satoshi Nakamoto"
            value={details.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full bg-[var(--hh-ink)] border border-[var(--hh-green-dark)] rounded-xl px-3 py-2 text-[var(--hh-cream)] text-sm focus:outline-none focus:border-[var(--hh-gold)] transition"
          />
        </div>

        {/* X Handle */}
        <div>
          <label className="block text-xs font-mono font-bold text-[var(--hh-gold)] mb-1">
            X / TWITTER HANDLE
          </label>
          <input
            type="text"
            placeholder="e.g. @satoshi"
            value={details.handle}
            onChange={(e) => updateField('handle', e.target.value)}
            className="w-full bg-[var(--hh-ink)] border border-[var(--hh-green-dark)] rounded-xl px-3 py-2 text-[var(--hh-cream)] text-sm focus:outline-none focus:border-[var(--hh-gold)] transition"
          />
        </div>

        {/* Track / Stack */}
        <div>
          <label className="block text-xs font-mono font-bold text-[var(--hh-gold)] mb-1">
            TRACK / TECH STACK
          </label>
          <select
            value={details.track}
            onChange={(e) => updateField('track', e.target.value)}
            className="w-full bg-[var(--hh-ink)] border border-[var(--hh-green-dark)] rounded-xl px-3 py-2 text-[var(--hh-cream)] text-sm focus:outline-none focus:border-[var(--hh-gold)] transition"
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
          <label className="block text-xs font-mono font-bold text-[var(--hh-gold)] mb-1">
            PRIMARY ROLE
          </label>
          <input
            type="text"
            placeholder="e.g. Hacker / Founder"
            value={details.role}
            onChange={(e) => updateField('role', e.target.value)}
            className="w-full bg-[var(--hh-ink)] border border-[var(--hh-green-dark)] rounded-xl px-3 py-2 text-[var(--hh-cream)] text-sm focus:outline-none focus:border-[var(--hh-gold)] transition"
          />
        </div>
      </div>

      {/* Project / Affiliation */}
      <div>
        <label className="block text-xs font-mono font-bold text-[var(--hh-gold)] mb-1">
          PROJECT / AFFILIATION
        </label>
        <input
          type="text"
          placeholder="e.g. Building Next-Gen AI Agents"
          value={details.company}
          onChange={(e) => updateField('company', e.target.value)}
          className="w-full bg-[var(--hh-ink)] border border-[var(--hh-green-dark)] rounded-xl px-3 py-2 text-[var(--hh-cream)] text-sm focus:outline-none focus:border-[var(--hh-gold)] transition"
        />
      </div>

      {/* Whimsical Builder Title */}
      <div className="bg-[var(--hh-ink)] p-3.5 rounded-xl border border-[var(--hh-green-dark)]">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-mono font-bold text-[var(--hh-pink)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--hh-pink)]" />
            GOA BUILDER TITLE
          </label>
          <button
            type="button"
            onClick={handleRerollTitle}
            className="text-xs text-[var(--hh-gold)] flex items-center gap-1 font-heading cursor-pointer"
          >
            🎲 Reroll Title
          </button>
        </div>

        <input
          type="text"
          value={details.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full bg-[var(--hh-green-dark)] border border-[var(--hh-green-dark)] rounded-lg px-3 py-2 text-[var(--hh-pink)] font-mono text-sm font-semibold focus:outline-none focus:border-[var(--hh-pink)]"
        />
      </div>
    </div>
  );
};
