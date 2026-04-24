'use client';

import { useState, useMemo, useEffect } from 'react';
import { GameCanvas } from '@/components/GameCanvas';
import { GameEngine, TROOP_STATS } from '@/engine/GameEngine';

export default function Home() {
  const engine = useMemo(() => new GameEngine(), []);
  const [gameState, setGameState] = useState(engine.getState());

  // Sync UI state with Engine state
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(engine.getState());
    }, 100); // Sync every 100ms for UI elements like gold
    return () => clearInterval(interval);
  }, [engine]);

  const handleSpawnTroop = () => {
    engine.spawnTroop('player');
    setGameState(engine.getState());
  };

  const canAfford = gameState.gold >= TROOP_STATS.BASIC.cost;

  return (
    <main className="min-h-screen bg-[#F0F0F0] p-8 flex flex-col items-center justify-center font-mono">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <header className="bg-black text-white p-6 border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Zone of Control</h1>
            <p className="text-sm mt-2 opacity-80 italic underline decoration-white/40">Phase 2: Combat & Economy // Neo-Brutalist Build</p>
          </div>
          
          {/* Gold Display */}
          <div className="bg-white text-black p-4 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
            <span className="block text-xs font-black uppercase opacity-50">Treasury</span>
            <span className="text-3xl font-black">${gameState.gold}</span>
          </div>
        </header>

        {/* Game Canvas */}
        <GameCanvas engine={engine} />

        {/* UI Controls */}
        <div className="bg-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-6 items-center">
          <div className="relative group">
            <button
              onClick={handleSpawnTroop}
              disabled={!canAfford}
              className={`px-8 py-4 text-xl font-bold uppercase border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                canAfford 
                  ? 'bg-black text-white hover:bg-white hover:text-black cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 border-gray-400 shadow-none translate-x-1 translate-y-1 cursor-not-allowed'
              }`}
            >
              Spawn Basic Troop
            </button>
            <span className="absolute -top-4 -right-4 bg-yellow-400 text-black text-xs font-black px-2 py-1 border-2 border-black rotate-12">
              COST: {TROOP_STATS.BASIC.cost}G
            </span>
          </div>

          <div className="flex-1 flex justify-end gap-8 text-sm font-black uppercase">
            <div className="border-l-4 border-black pl-4">
              <span className="block opacity-50">Active Troops</span>
              <span className="text-2xl">{gameState.troops.length}</span>
            </div>
            <div className="border-l-4 border-black pl-4">
              <span className="block opacity-50">Castle Integrity</span>
              <span className="text-2xl">{Math.ceil((gameState.playerCastle.health / gameState.playerCastle.maxHealth) * 100)}%</span>
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
