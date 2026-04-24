'use client';

import { useState, useMemo } from 'react';
import { GameCanvas } from '@/components/GameCanvas';
import { GameEngine } from '@/engine/GameEngine';

export default function Home() {
  const engine = useMemo(() => new GameEngine(), []);
  const [troopCount, setTroopCount] = useState(0); // Just for forcing a re-render if needed, though engine handles its own state

  const handleSpawnTroop = () => {
    engine.spawnTroop('player');
    setTroopCount(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-[#F0F0F0] p-8 flex flex-col items-center justify-center font-mono">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <header className="bg-black text-white p-6 border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Zone of Control</h1>
          <p className="text-sm mt-2 opacity-80 italic underline decoration-white/40">Foundational Engine v1.0 // Neo-Brutalist Build</p>
        </header>

        {/* Game Canvas */}
        <GameCanvas engine={engine} />

        {/* UI Controls */}
        <div className="bg-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-6 items-center">
          <button
            onClick={handleSpawnTroop}
            className="bg-black text-white px-8 py-4 text-xl font-bold uppercase border-[4px] border-black hover:bg-white hover:text-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            Spawn Basic Troop
          </button>

          <div className="flex-1 flex justify-end gap-8 text-sm font-black uppercase">
            <div className="border-l-4 border-black pl-4">
              <span className="block opacity-50">Active Troops</span>
              <span className="text-2xl">{troopCount}</span>
            </div>
            <div className="border-l-4 border-black pl-4">
              <span className="block opacity-50">System Status</span>
              <span className="text-2xl text-green-600">60 FPS</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer / Info */}
      <footer className="mt-12 text-center opacity-40 text-xs font-bold uppercase tracking-widest">
        Neo-Brutalist Strategy Engine &copy; 2026 Harshal Patel
      </footer>
    </main>
  );
}
