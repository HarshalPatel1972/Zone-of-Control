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
    <main className="min-h-screen bg-[#1a0f00] p-2 sm:p-6 flex flex-col items-center overflow-hidden">
      
      {/* Top Banner */}
      <div className="max-w-[1400px] w-full flex justify-between items-center mb-6 px-4 py-3 fancy-border bg-[#2c1e0f]">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="block text-[10px] uppercase text-[var(--gold)] opacity-60">Battlefield</span>
            <span className="text-xl font-bold uppercase tracking-widest">#{roomId.substring(0,4)}</span>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="text-center">
            <span className="block text-[10px] uppercase text-[var(--gold)] opacity-60">Network</span>
            <span className="text-xl font-bold uppercase text-green-500">{ping}ms</span>
          </div>
        </div>

        <div className="flex items-center gap-12">
            <div className="text-right">
                <span className="block text-[10px] uppercase text-[var(--gold)] opacity-60 mb-1">Treasury</span>
                <span className="text-5xl font-black gold-display">${myGold}</span>
            </div>
            <div className="h-16 w-px bg-white/10"></div>
            <div className="text-left">
                <span className="block text-[10px] uppercase text-[var(--gold)] opacity-60 mb-1">Opposition</span>
                <span className="text-3xl font-bold opacity-60">${enemyGold}</span>
            </div>
        </div>

        <button onClick={handleExit} className="px-6 py-2 border-2 border-[#8B0000] text-[#8B0000] text-xs font-bold uppercase hover:bg-[#8B0000] hover:text-white transition-all">
          Retreat
        </button>
      </div>

      {/* Battlefield View */}
      <div className="relative w-full max-w-[1400px] aspect-[16/9] border-8 border-[#3d2b16] shadow-2xl overflow-hidden rounded-sm bg-black">
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

      {/* Command Bar */}
      <div className="max-w-[1200px] w-full mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleSpawn('basic')}
          disabled={!isGameStarted || myGold < TROOP_STATS.BASIC.cost}
          className="unit-button p-4 flex flex-col items-center"
        >
          <img src="/assets/knight.png" className="w-16 h-16 mb-2 object-contain" />
          <span className="text-xl font-bold uppercase mb-1">Knight</span>
          <span className="text-sm text-[var(--gold)] font-bold tracking-widest">${TROOP_STATS.BASIC.cost}G</span>
        </button>

        <button
          onClick={() => handleSpawn('archer')}
          disabled={!isGameStarted || myGold < TROOP_STATS.ARCHER.cost}
          className="unit-button p-4 flex flex-col items-center"
        >
          <img src="/assets/archer.png" className="w-16 h-16 mb-2 object-contain" />
          <span className="text-xl font-bold uppercase mb-1">Archer</span>
          <span className="text-sm text-[var(--gold)] font-bold tracking-widest">${TROOP_STATS.ARCHER.cost}G</span>
        </button>

        <button
          onClick={() => handleSpawn('berserker')}
          disabled={!isGameStarted || myGold < TROOP_STATS.BERSERKER.cost}
          className="unit-button p-4 flex flex-col items-center"
        >
          <img src="/assets/berserker.png" className="w-16 h-16 mb-2 object-contain" />
          <span className="text-xl font-bold uppercase mb-1">Berserker</span>
          <span className="text-sm text-[var(--gold)] font-bold tracking-widest">${TROOP_STATS.BERSERKER.cost}G</span>
        </button>

        <button
          onClick={handleUpgrade}
          disabled={!isGameStarted || (isHost ? gameState.playerCastle.level >= 3 : gameState.opponentCastle.level >= 3)}
          className="unit-button p-4 flex flex-col items-center"
        >
          <div className="w-16 h-16 mb-2 flex items-center justify-center border-2 border-[var(--gold)] rounded-full">
            <span className="text-3xl">↑</span>
          </div>
          <span className="text-xl font-bold uppercase mb-1">Fortify Castle</span>
          <span className="text-sm text-[var(--gold)] font-bold tracking-widest uppercase">
            LVL {(isHost ? gameState.playerCastle.level : gameState.opponentCastle.level)}
          </span>
        </button>
      </div>

    </main>
  );
}
