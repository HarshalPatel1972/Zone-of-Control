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
    if (type === 'upgrade') {
      engine.upgradeCastle(team);
    } else {
      engine.spawnRemoteTroop(team, type as TroopType);
    }
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
    const castle = team === 'player' ? gameState.playerCastle : gameState.opponentCastle;
    const nextLevel = (castle.level + 1) as 2 | 3;
    const upgrade = CASTLE_UPGRADES[nextLevel];

    if (!upgrade) return;
    const gold = isHost ? gameState.gold : gameState.opponentGold;
    if (gold < upgrade.cost) return;

    engine.upgradeCastle(team);
    sendSpawn(team, 'upgrade');
    setGameState(engine.getState());
  };

  const myGold = isHost ? gameState.gold : gameState.opponentGold;
  const enemyGold = isHost ? gameState.opponentGold : gameState.gold;

  return (
    <main className="min-h-screen bg-[#080808] text-white p-2 sm:p-6 flex flex-col font-sans scanlines overflow-hidden">
      
      {/* Header Panel */}
      <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        
        {/* Connection Status */}
        <div className="bg-zinc-900 border-2 border-zinc-800 p-4 brutalist-shadow flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Connection</span>
            <span className="bg-[var(--accent-primary)] text-black px-2 py-0.5 text-[10px] font-black uppercase">
              {isGameStarted ? 'Battle Active' : 'Waiting...'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white uppercase tracking-tighter">
              {isHost ? 'Command Center' : 'Remote Force'}
            </span>
            <span className="text-xs font-mono text-zinc-500">#{roomId.substring(0,6)}</span>
          </div>
        </div>

        {/* Global Stats (Gold) */}
        <div className="bg-black border-2 border-zinc-800 p-4 brutalist-shadow flex justify-around items-center">
          <div className="text-center px-4">
            <span className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Your Gold</span>
            <span className="text-4xl font-black text-[var(--accent-primary)] font-mono">${myGold}</span>
          </div>
          <div className="w-px h-12 bg-zinc-800"></div>
          <div className="text-center px-4">
            <span className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Enemy Gold</span>
            <span className="text-4xl font-black text-[var(--accent-secondary)] font-mono">${enemyGold}</span>
          </div>
        </div>

        {/* Tactical Info */}
        <div className="bg-zinc-900 border-2 border-zinc-800 p-4 brutalist-shadow flex justify-between items-center">
          <div>
            <span className="block text-[9px] font-black uppercase text-zinc-500 mb-1">Network Ping</span>
            <span className="text-xl font-black text-green-500">{ping}ms</span>
          </div>
          <button 
            onClick={handleExit}
            className="px-6 py-2 bg-zinc-800 border-2 border-zinc-700 text-xs font-black uppercase hover:bg-red-600 transition-colors"
          >
            Leave Battle
          </button>
        </div>
      </div>

      {/* Main Battlefield Canvas */}
      <div className="flex-1 relative bg-[#111] border-4 border-zinc-800 brutalist-shadow-lg overflow-hidden flex items-center justify-center mb-4">
        <div className="w-full h-full max-w-[1600px] aspect-[16/9]">
          <GameCanvas engine={engine} />
        </div>
        
        {!isGameStarted && (
          <LobbyOverlay roomId={roomId} isHost={isHost} onCopy={() => {}} />
        )}

        <GameOverOverlay 
          status={gameState.status} 
          onRestart={() => engine.reset()} 
          onExit={handleExit}
        />
      </div>

      {/* Control Dock */}
      <div className="max-w-[1200px] mx-auto w-full bg-[#1A1A1A] p-4 border-2 border-zinc-800 brutalist-shadow grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        
        {/* Troop: Knight */}
        <button
          onClick={() => handleSpawn('basic')}
          disabled={!isGameStarted || myGold < TROOP_STATS.BASIC.cost}
          className="group flex flex-col items-center justify-center p-4 bg-zinc-900 border-2 border-zinc-800 hover:border-[var(--accent-primary)] hover:bg-black transition-all disabled:opacity-30 disabled:grayscale"
        >
          <span className="text-[10px] font-black uppercase text-zinc-500 mb-2">Basic Unit</span>
          <span className="text-lg font-black uppercase leading-none mb-2 text-white">Knight</span>
          <span className="bg-black text-[var(--accent-primary)] px-2 py-0.5 text-xs font-black border border-zinc-800 group-hover:border-[var(--accent-primary)]">
            ${TROOP_STATS.BASIC.cost}
          </span>
        </button>

        {/* Troop: Archer */}
        <button
          onClick={() => handleSpawn('archer')}
          disabled={!isGameStarted || myGold < TROOP_STATS.ARCHER.cost}
          className="group flex flex-col items-center justify-center p-4 bg-zinc-900 border-2 border-zinc-800 hover:border-cyan-400 hover:bg-black transition-all disabled:opacity-30 disabled:grayscale"
        >
          <span className="text-[10px] font-black uppercase text-zinc-500 mb-2">Ranged Support</span>
          <span className="text-lg font-black uppercase leading-none mb-2 text-white">Archer</span>
          <span className="bg-black text-cyan-400 px-2 py-0.5 text-xs font-black border border-zinc-800 group-hover:border-cyan-400">
            ${TROOP_STATS.ARCHER.cost}
          </span>
        </button>

        {/* Troop: Berserker */}
        <button
          onClick={() => handleSpawn('berserker')}
          disabled={!isGameStarted || myGold < TROOP_STATS.BERSERKER.cost}
          className="group flex flex-col items-center justify-center p-4 bg-zinc-900 border-2 border-zinc-800 hover:border-[var(--accent-secondary)] hover:bg-black transition-all disabled:opacity-30 disabled:grayscale"
        >
          <span className="text-[10px] font-black uppercase text-zinc-500 mb-2">Heavy Offense</span>
          <span className="text-lg font-black uppercase leading-none mb-2 text-white">Berserker</span>
          <span className="bg-black text-[var(--accent-secondary)] px-2 py-0.5 text-xs font-black border border-zinc-800 group-hover:border-[var(--accent-secondary)]">
            ${TROOP_STATS.BERSERKER.cost}
          </span>
        </button>

        {/* Upgrade: Castle */}
        <button
          onClick={handleUpgrade}
          disabled={!isGameStarted || (isHost ? gameState.playerCastle.level >= 3 : gameState.opponentCastle.level >= 3)}
          className="group flex flex-col items-center justify-center p-4 bg-zinc-900 border-2 border-zinc-800 hover:border-white hover:bg-black transition-all disabled:opacity-30 disabled:grayscale"
        >
          <span className="text-[10px] font-black uppercase text-zinc-500 mb-2">Defensive Tech</span>
          <span className="text-lg font-black uppercase leading-none mb-2 text-white">Fortify Castle</span>
          <span className="bg-white text-black px-2 py-0.5 text-xs font-black border border-black">
             LVL {(isHost ? gameState.playerCastle.level : gameState.opponentCastle.level)} → NEXT
          </span>
        </button>

        {/* Integrity Stats */}
        <div className="hidden md:flex flex-col items-center justify-center p-4 bg-black border-2 border-zinc-800">
          <span className="text-[10px] font-black uppercase text-zinc-500 mb-1">Castle Health</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-[var(--accent-secondary)]">
              {Math.ceil(( (isHost ? gameState.playerCastle.health : gameState.opponentCastle.health) / (isHost ? gameState.playerCastle.maxHealth : gameState.opponentCastle.maxHealth) ) * 100)}
            </span>
            <span className="text-sm font-black opacity-30">%</span>
          </div>
        </div>

      </div>

    </main>
  );
}
