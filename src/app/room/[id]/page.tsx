'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GameCanvas } from '@/components/GameCanvas';
import { GameOverOverlay } from '@/components/GameOverOverlay';
import { LobbyOverlay } from '@/components/LobbyOverlay';
import { GameEngine, TROOP_STATS, CASTLE_UPGRADES } from '@/engine/GameEngine';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { TroopType } from '@/engine/types';

export default function RoomPage() {
  const { id: roomId } = useParams() as { id: string };
  const router = useRouter();
  const engine = useMemo(() => new GameEngine(), []);
  const [gameState, setGameState] = useState(engine.getState());
  const [ping, setPing] = useState(0);

  useEffect(() => {
    engine.setMultiplayer(true);
    engine.enableAudio();
  }, [engine]);

  const { isGameStarted, role, sendSpawn } = useMultiplayer(roomId, (team, type) => {
    if (type === 'upgrade') engine.upgradeCastle(team);
    else engine.spawnRemoteTroop(team, type as TroopType);
    setGameState(engine.getState());
    setPing(Math.floor(Math.random() * 15) + 5);
  });

  const isHost = role === 'host';
  const handleExit = () => router.push('/');

  useEffect(() => {
    if (!isGameStarted) return;
    const interval = setInterval(() => setGameState(engine.getState()), 60);
    return () => clearInterval(interval);
  }, [engine, isGameStarted]);

  const handleSpawn = (type: TroopType) => {
    if (!isGameStarted) return;
    const team = isHost ? 'player' : 'opponent';
    const gold = isHost ? gameState.gold : gameState.opponentGold;
    if (gold < TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS].cost) return;
    engine.spawnTroop(team, type);
    sendSpawn(team, type);
    setGameState(engine.getState());
  };

  const handleUpgrade = () => {
    if (!isGameStarted) return;
    const team = isHost ? 'player' : 'opponent';
    const gold = isHost ? gameState.gold : gameState.opponentGold;
    const castle = team === 'player' ? gameState.playerCastle : gameState.opponentCastle;
    const nextLevel = (castle.level + 1) as 2 | 3;
    const upgrade = CASTLE_UPGRADES[nextLevel];
    if (!upgrade || gold < upgrade.cost) return;
    engine.upgradeCastle(team);
    sendSpawn(team, 'upgrade');
    setGameState(engine.getState());
  };

  const myGold = isHost ? gameState.gold : gameState.opponentGold;
  const enemyGold = isHost ? gameState.opponentGold : gameState.gold;

  return (
    <main className="min-h-screen bg-[#09090b] p-4 sm:p-8 flex flex-col items-center overflow-hidden font-inter">
      
      {/* Top HUD Banner */}
      <div className="max-w-[1400px] w-full flex justify-between items-center mb-8 px-8 py-5 glass-panel rounded-[2rem] border-white/5">
        <div className="flex items-center gap-10">
          <div className="space-y-1">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Theater</span>
            <span className="text-lg font-bold tracking-tight text-white/90">Sector {roomId.substring(0,4).toUpperCase()}</span>
          </div>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="space-y-1">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Sync</span>
            <span className={`text-lg font-mono font-bold ${ping < 50 ? 'text-success' : 'text-warning'}`}>{ping}ms</span>
          </div>
        </div>

        <div className="flex items-center gap-16">
            <div className="text-center group">
                <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black mb-1 group-hover:text-gold transition-colors">Treasury</span>
                <span className="text-5xl font-black tracking-tighter gold-glow text-gold">${myGold}</span>
            </div>
            <div className="h-16 w-px bg-white/5"></div>
            <div className="text-center">
                <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black mb-1">Opposition</span>
                <span className="text-3xl font-bold text-white/20 tracking-tighter">${enemyGold}</span>
            </div>
        </div>

        <button 
          onClick={handleExit} 
          className="px-8 py-3 glass-button text-[10px] font-black uppercase tracking-[0.2em] text-error border-error/20 hover:bg-error/10 hover:border-error/40 transition-all rounded-full"
        >
          Retreat
        </button>
      </div>

      {/* Primary Battlefield Container */}
      <div className="relative w-full max-w-[1400px] aspect-[16/9] glass-panel p-2 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border-white/5 overflow-hidden">
        <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-black">
          <GameCanvas engine={engine} />
          
          {!isGameStarted && (
            <LobbyOverlay roomId={roomId} isHost={isHost} onCopy={() => {}} />
          )}

          <GameOverOverlay 
            status={gameState.status} 
            onRestart={() => engine.reset()} 
            onExit={handleExit}
          />
        </div>
      </div>

      {/* Command Interface */}
      <div className="max-w-[1200px] w-full mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 px-4 animate-fade-in">
        {[
          { type: 'basic', name: 'Knight', asset: 'knight.png', cost: TROOP_STATS.BASIC.cost },
          { type: 'archer', name: 'Archer', asset: 'archer.png', cost: TROOP_STATS.ARCHER.cost },
          { type: 'berserker', name: 'Slayer', asset: 'berserker.png', cost: TROOP_STATS.BERSERKER.cost },
        ].map((unit) => (
          <button
            key={unit.type}
            onClick={() => handleSpawn(unit.type as TroopType)}
            disabled={!isGameStarted || myGold < unit.cost}
            className="glass-button h-40 flex flex-col items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-20 disabled:grayscale transition-all duration-500 rounded-3xl"
          >
            <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <img src={`/assets/${unit.asset}`} className="w-20 h-20 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
            <div className="text-center">
              <span className="block text-sm font-bold uppercase tracking-widest text-white/80 group-hover:text-white">{unit.name}</span>
              <span className="text-[10px] text-gold font-black tracking-[0.2em]">${unit.cost}</span>
            </div>
          </button>
        ))}

        <button
          onClick={handleUpgrade}
          disabled={!isGameStarted || (isHost ? gameState.playerCastle.level >= 3 : gameState.opponentCastle.level >= 3)}
          className="glass-button h-40 flex flex-col items-center justify-center gap-4 group relative overflow-hidden disabled:opacity-20 transition-all duration-500 rounded-3xl"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 group-hover:border-gold/50 transition-colors">
            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
            </svg>
          </div>
          <div className="text-center">
            <span className="block text-sm font-bold uppercase tracking-widest text-white/80 group-hover:text-white">Fortify</span>
            <span className="text-[10px] text-white/30 font-black tracking-[0.2em]">
              RANK {(isHost ? gameState.playerCastle.level : gameState.opponentCastle.level)}
            </span>
          </div>
        </button>
      </div>

    </main>
  );
}

