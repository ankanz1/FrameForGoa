import React, { useState, useEffect } from 'react';
import { MapPin, Calendar } from 'lucide-react';

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Target date: Oct 28, 2026 00:00:00
    const targetDate = new Date('2026-10-28T00:00:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-8 relative group">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#ff2e8f] via-[#f6c81a] to-[#ff2e8f] rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500 -z-10"></div>
      
      <div className="bg-[#084f2b]/80 backdrop-blur-md border border-[#1b3d2c] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Tropical background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f6c81a] rounded-full mix-blend-overlay filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff2e8f] rounded-full mix-blend-overlay filter blur-3xl opacity-10 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          
          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 bg-[#063b20] px-3 py-1 rounded-full border border-[#1b3d2c] mb-2">
              <span className="font-mono text-xs font-bold text-[#f6c81a] uppercase tracking-wider">The Countdown Begins</span>
            </div>
            <h3 className="font-playfair text-3xl sm:text-4xl font-bold text-[#fef6e4]">
              HH Goa 2026
            </h3>
            <p className="font-mono text-sm text-[#cbd5e1] flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4 text-[#ff2e8f]" /> Goa,India
              <span className="mx-2 opacity-50">|</span>
              <Calendar className="w-4 h-4 text-[#ff2e8f]" /> October 28, 2026
            </p>
          </div>

          <div className="flex gap-3 sm:gap-4 shrink-0">
            {[
              { label: 'DAYS', value: timeLeft.days },
              { label: 'HOURS', value: timeLeft.hours },
              { label: 'MINS', value: timeLeft.minutes },
              { label: 'SECS', value: timeLeft.seconds },
            ].map((unit, idx) => (
              <div key={unit.label} className="flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-b from-[#063b20] to-[#08140e] border border-[#1b3d2c] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden mb-2 group-hover:border-[#f6c81a]/30 transition-colors">
                  {/* Subtle shine effect */}
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-white/5 rounded-t-2xl"></div>
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-[#f6c81a]">
                    {unit.value.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-[#94a3b8] tracking-widest">{unit.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
