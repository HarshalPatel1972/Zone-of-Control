'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameCanvas } from '@/components/GameCanvas';
import { GameOverOverlay } from '@/components/GameOverOverlay';
import { LobbyOverlay } from '@/components/LobbyOverlay';
import { GameEngine, TROOP_STATS } from '@/engine/GameEngine';
import { useMultiplayer } from '@/hooks/useMultiplayer';

export default function RoomPage() {
  const { id: roomId } = useParams() as { id: string };
  const router = useRouter();
  const engine = useMemo(() => new GameEngine(), []);
  const [gameState, setGameState] = useState(engine.getState());
  const [ping, setPing] = useState(0);

  // Initialize engine for multiplayer
  useEffect(() => {
    engine.setMultiplayer(true);
    engine.enableAudio();
  }, [engine]);

  const { isGameStarted, role, sendSpawn } = useMultiplayer(roomId, (team, type) => {
    engine.spawnRemoteTroop(team);
    setGameState(engine.getState());
    setPing(Math.floor(Math.random() * 20) + 10);
  });

  const isHost = role === 'host';

  const handleExit = () => {
    router.push('/');
  };

  // Sync UI state with Engine state
  useEffect(() => {
    if (!isGameStarted) return;
    const interval = setInterval(() => {
      setGameState(engine.getState());
    }, 100);
    return () => clearInterval(interval);
  }, [engine, isGameStarted]);

  const handleSpawnTroop = () => {
    if (!isGameStarted) return;
    const myTeam = isHost ? 'player' : 'opponent';
    const currentGold = isHost ? gameState.gold : gameState.opponentGold;
    if (currentGold < TROOP_STATS.BASIC.cost) return;

    engine.spawnTroop(myTeam);
    sendSpawn(myTeam, 'basic');
    setGameState(engine.getState());
  };

  const handleRestart = () => {
    engine.reset();
    setGameState(engine.getState());
  };

  const myGold = isHost ? gameState.gold : gameState.opponentGold;
  const enemyGold = isHost ? gameState.opponentGold : gameState.gold;
  const canAfford = myGold >= TROOP_STATS.BASIC.cost;

  return (
    <main className="min-h-screen bg-[#0D0D0D] p-4 sm:p-8 flex flex-col items-center justify-center font-sans overflow-hidden scanlines">
      <div className="max-w-7xl w-full space-y-6 relative z-10">
        
        {/* Instrumentation-style Header */}
        <header className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="bg-black border-[4px] border-black brutalist-shadow p-6 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">
                  Sector <span className="text-[var(--accent-primary)]">{roomId.substring(0, 4)}</span>
                </h1>
                <p className="text-[10px] font-bold text-white/40 uppercase mt-2 tracking-widest">
                  Operational Theater // Sync Status: {isGameStarted ? 'Active' : 'Locked'}
                </p>
              </div>
              <div className="bg-[var(--accent-primary)] text-black px-3 py-1 text-[10px] font-black uppercase">
                {isHost ? 'Host Command' : 'Remote Guest'}
              </div>
            </div>
            
            <div className="mt-6 flex gap-8">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Latency</span>
                <span className={`text-xl font-black ${ping > 100 ? 'text-red-500' : 'text-green-500'}`}>
                  {ping}ms
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Troops</span>
                <span className="text-xl font-black">{gameState.troops.length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Status</span>
                <span className="text-xl font-black uppercase text-[var(--accent-primary)]">Online</span>
              </div>
            </div>
          </div>

          {/* Economy Display */}
          <div className="flex gap-4 min-w-[320px]">
             <div className="flex-1 bg-[#1A1A1A] brutalist-border brutalist-shadow p-4 flex flex-col justify-center items-center">
                <span className="text-[9px] font-black uppercase text-white/40 mb-1">Host Treasury</span>
                <span className="text-3xl font-black font-mono text-white">${gameState.gold}</span>
             </div>
             <div className="flex-1 bg-[var(--accent-primary)] brutalist-border brutalist-shadow p-4 flex flex-col justify-center items-center">
                <span className="text-[9px] font-black uppercase text-black/60 mb-1">Guest Treasury</span>
                <span className="text-3xl font-black font-mono text-black">${gameState.opponentGold}</span>
             </div>
          </div>
        </header>

        {/* Combat Theater */}
        <div className="relative bg-white brutalist-border brutalist-shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-30 animate-pulse"></div>
          <GameCanvas engine={engine} />
          
          {!isGameStarted && (
            <LobbyOverlay 
              roomId={roomId} 
              isHost={isHost} 
              onCopy={() => {}} 
            />
          )}

          <GameOverOverlay 
            status={gameState.status} 
            onRestart={handleRestart} 
            onExit={handleExit}
          />
        </div>

        {/* Tactical Controls */}
        <div className="bg-[#1A1A1A] p-6 brutalist-border brutalist-shadow flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 flex gap-4 w-full md:w-auto">
            <button
              onClick={handleSpawnTroop}
              disabled={!canAfford || !isGameStarted}
              className={`flex-1 h-20 text-2xl font-black uppercase border-[4px] border-black transition-all flex items-center justify-center gap-4 relative overflow-hidden ${
                canAfford && isGameStarted
                  ? 'bg-[var(--accent-primary)] text-black hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed'
              }`}
            >
              <span className="relative z-10">Deploy Basic Unit</span>
              <span className="bg-black text-[var(--accent-primary)] px-2 py-1 text-xs font-black brutalist-border group-hover:bg-white transition-colors">
                {TROOP_STATS.BASIC.cost}G
              </span>
              {canAfford && isGameStarted && (
                <div className="absolute top-0 left-0 w-full h-1 bg-white/40 animate-[slide_1s_infinite]"></div>
              )}
            </button>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-black text-white p-4 border-[4px] border-black flex flex-col justify-center items-center min-w-[140px]">
               <span className="text-[9px] font-black uppercase text-white/40 mb-1 italic">Castle Integrity</span>
               <div className="flex items-end gap-1">
                 <span className="text-3xl font-black text-[var(--accent-secondary)]">
                   {Math.ceil((gameState.playerCastle.health / gameState.playerCastle.maxHealth) * 100)}
                 </span>
                 <span className="text-sm font-black mb-1 opacity-40">%</span>
               </div>
            </div>
            <button 
              onClick={handleExit}
              className="bg-zinc-800 text-white px-6 py-4 border-[4px] border-black font-black uppercase text-xs hover:bg-red-600 transition-colors"
            >
              Aband.
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
}
