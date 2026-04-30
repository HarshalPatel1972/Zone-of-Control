'use client';

import React, { useEffect, useState, useRef } from 'react';
import { GameEngine, TROOP_STATS, CASTLE_UPGRADES } from '@/engine/GameEngine';
import { GameState, TroopType, Team, AbilityType } from '@/engine/types';
import { GameCanvas } from '@/components/GameCanvas';
import { LobbyOverlay } from '@/components/LobbyOverlay';
import { GameOverOverlay } from '@/components/GameOverOverlay';
import { useMultiplayer } from '@/hooks/useMultiplayer';

export default function RoomPage({ params }: { params: { id: string } }) {
  const roomId = params.id;
  const [engine] = useState(() => new GameEngine());
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [isStarted, setIsStarted] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const { isHost, sendSpawn } = useMultiplayer(roomId, (team, type, data) => {
    if (type === 'upgrade') engine.upgradeCastle(team);
    else if (type.startsWith('ability_')) {
        const parts = type.split('_');
        const abilityType = parts[1] as AbilityType;
        const targetX = parts[2] ? parseInt(parts[2]) : undefined;
        engine.useAbility(team, abilityType, targetX);
    }
    else if (type.startsWith('cmd_')) engine.issueCommand(team, type.split('_')[1] as any);
    else if (type.startsWith('emote_')) engine.triggerEmote(team, type.split('_')[1]);
    else engine.spawnRemoteTroop(team, type as TroopType);
    setGameState(engine.getState());
  });

  const handleStartCpu = () => {
    setIsStarted(true);
    setIsTraining(true);
  };

  useEffect(() => {
    if (!isStarted) return;
    const interval = setInterval(() => setGameState(engine.getState()), 60);
    return () => clearInterval(interval);
  }, [engine, isStarted]);

  const handleSpawn = (type: TroopType) => {
    if (!isStarted) return;
    const team = isHost ? 'player' : 'opponent';
    engine.spawnTroop(team, type);
    if (!isTraining) sendSpawn(team, type);
    setGameState(engine.getState());
  };

  const handleUpgrade = () => {
    if (!isStarted) return;
    const team = isHost ? 'player' : 'opponent';
    engine.upgradeCastle(team);
    if (!isTraining) sendSpawn(team, 'upgrade');
    setGameState(engine.getState());
  };

  const [targetingAbility, setTargetingAbility] = useState<AbilityType | null>(null);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') engine.setCameraX(gameState.cameraX - 100);
        if (e.key === 'ArrowRight') engine.setCameraX(gameState.cameraX + 100);
        setGameState(engine.getState());
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [gameState.cameraX]);

  const handleAbility = (type: AbilityType) => {
    if (!isStarted) return;
    const targeted: AbilityType[] = ['meteor', 'superMeteor', 'lightning', 'iceFreeze', 'moon', 'heal'];
    if (targeted.includes(type)) {
        setTargetingAbility(type);
        return;
    }
    engine.useAbility(isHost ? 'player' : 'opponent', type);
    if (!isTraining) sendSpawn(isHost ? 'player' : 'opponent', `ability_${type}`);
    setGameState(engine.getState());
  };

  const onCanvasClick = (x: number, y: number) => {
    if (targetingAbility) {
        engine.useAbility(isHost ? 'player' : 'opponent', targetingAbility, x);
        if (!isTraining) sendSpawn(isHost ? 'player' : 'opponent', `ability_${targetingAbility}_${Math.floor(x)}`);
        setTargetingAbility(null);
        setGameState(engine.getState());
    }
  };

  const handleCommand = (cmd: 'charge' | 'retreat') => {
    if (!isStarted) return;
    engine.issueCommand(isHost ? 'player' : 'opponent', cmd);
    if (!isTraining) sendSpawn(isHost ? 'player' : 'opponent', `cmd_${cmd}`);
    setGameState(engine.getState());
  };

  const handleEmote = (type: string) => {
    if (!isStarted) return;
    engine.triggerEmote(isHost ? 'player' : 'opponent', type);
    if (!isTraining) sendSpawn(isHost ? 'player' : 'opponent', `emote_${type}`);
    setGameState(engine.getState());
  };

  const myGold = isHost ? gameState.gold : gameState.opponentGold;
  const enemyGold = isHost ? gameState.opponentGold : gameState.gold;
  const playerVisionX = Math.max(...gameState.troops.filter(t => t.team === 'player').map(t => t.x), 400);
  const isOpponentVisible = gameState.troops.some(t => t.team === 'opponent' && t.x < playerVisionX + 600);
  const enemyGoldDisplay = isOpponentVisible ? `$${enemyGold}` : '???';
  const myStats = isHost ? gameState.stats.player : gameState.stats.opponent;

  return (
    <main className="min-h-screen bg-[#09090b] p-4 sm:p-8 flex flex-col items-center overflow-hidden font-inter">
      
      {/* Top HUD Banner */}
      <div className="max-w-[1400px] w-full flex justify-between items-center mb-6 px-8 py-4 glass-panel rounded-3xl border-white/5">
        <div className="flex items-center gap-8">
          <div className="space-y-1">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Theater</span>
            <span className="text-base font-bold tracking-tight text-white/90">Sector {roomId.substring(0,4).toUpperCase()}</span>
          </div>
          <div className="h-8 w-px bg-white/5"></div>
          <div className="space-y-1">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Treasury</span>
            <span className="text-2xl font-black text-gold">${myGold}</span>
          </div>
          <div className="h-8 w-px bg-white/5"></div>
          <div className="space-y-1">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Kills</span>
            <span className="text-xl font-mono font-bold text-error">{myStats.kills}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
            <div className="text-center">
                <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black mb-1">Opposition</span>
                <span className="text-xl font-bold text-white/20 tracking-tighter">{enemyGoldDisplay}</span>
            </div>
            <button onClick={() => window.location.href = '/'} className="px-6 py-2 glass-button text-[10px] font-black uppercase tracking-widest text-error border-error/20 rounded-full">Exit</button>
        </div>
      </div>

      {/* Primary Battlefield Container */}
      <div className={`relative w-full max-w-[1400px] aspect-[16/9] glass-panel p-2 rounded-[2rem] shadow-2xl border-white/5 overflow-hidden ${targetingAbility ? 'cursor-crosshair ring-2 ring-gold/50' : ''}`}>
        <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-black">
          <GameCanvas engine={engine} onClick={onCanvasClick} />
          
          {!isStarted && <LobbyOverlay roomId={roomId} isHost={isHost} onCopy={() => {}} onStartCpu={handleStartCpu} />}

          {/* Minimap */}
          <div className="absolute top-4 right-4 w-64 h-16 glass-panel rounded-xl overflow-hidden border-white/10 pointer-events-none">
             <div className="relative w-full h-full bg-black/40 backdrop-blur-md">
                <div className="absolute top-0 h-full border border-gold/40 bg-gold/5" style={{ left: `${(gameState.cameraX / 4000) * 100}%`, width: `${(1600 / 4000) * 100}%` }} />
                <div className="absolute left-2 bottom-1 w-2 h-2 bg-success/60 rounded-sm" />
                <div className="absolute right-2 bottom-1 w-2 h-2 bg-error/60 rounded-sm" />
                {gameState.troops.map(t => <div key={t.id} className={`absolute bottom-1 w-1 h-1 rounded-full ${t.team === 'player' ? 'bg-success' : 'bg-error'}`} style={{ left: `${(t.x / 4000) * 100}%` }} />)}
             </div>
          </div>

          <GameOverOverlay status={gameState.status} onRestart={() => engine.reset()} onExit={() => window.location.href = '/'} />

          {/* Staging Commands */}
          {isStarted && (
            <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-auto">
               <button onClick={() => handleCommand('charge')} className="px-6 py-3 bg-success text-white text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">CHARGE</button>
               <button onClick={() => handleCommand('retreat')} className="px-6 py-3 bg-error text-white text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">RETREAT</button>
            </div>
          )}

          {/* New Expanded Abilities Bar */}
          {isStarted && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 max-w-[600px] pointer-events-auto">
               {(['meteor', 'lightning', 'iceFreeze', 'moon', 'superMeteor', 'heal', 'superHeal', 'shield'] as const).map(id => {
                 const abilities = isHost ? gameState.playerAbilities : gameState.opponentAbilities;
                 const data = abilities[id];
                 const isReady = Date.now() - data.lastUsed >= data.cooldown;
                 const name = id.replace(/([A-Z])/g, ' $1').toUpperCase();
                 const colors: Record<string, string> = { meteor: 'text-error', lightning: 'text-blue-400', iceFreeze: 'text-cyan-300', moon: 'text-purple-400', superMeteor: 'text-orange-600', heal: 'text-success', superHeal: 'text-emerald-400', shield: 'text-gold' };
                 
                 return (
                   <button
                    key={id}
                    onClick={() => handleAbility(id)}
                    disabled={!isReady}
                    className={`px-4 py-2 glass-panel rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${isReady ? `${colors[id] || 'text-white'} border-white/20 hover:scale-105 active:scale-95` : 'opacity-20 scale-90'}`}
                   >
                     {name}
                   </button>
                 )
               })}
            </div>
          )}
        </div>
      </div>

      {/* Optimized Command Interface (Smaller Buttons) */}
      <div className="max-w-[1400px] w-full mt-6 grid grid-cols-3 md:grid-cols-7 gap-3 px-2">
        {[
          { type: 'basic', name: 'Knight', cost: TROOP_STATS.BASIC.cost, max: TROOP_STATS.BASIC.maxCount, asset: 'knight' },
          { type: 'archer', name: 'Archer', cost: TROOP_STATS.ARCHER.cost, max: TROOP_STATS.ARCHER.maxCount, asset: 'archer' },
          { type: 'berserker', name: 'Slayer', cost: TROOP_STATS.BERSERKER.cost, max: TROOP_STATS.BERSERKER.maxCount, asset: 'berserker' },
          { type: 'fire_archer', name: 'Fire', cost: TROOP_STATS.FIRE_ARCHER.cost, max: TROOP_STATS.FIRE_ARCHER.maxCount, asset: 'archer' },
          { type: 'crossman', name: 'Cross', cost: TROOP_STATS.CROSSMAN.cost, max: TROOP_STATS.CROSSMAN.maxCount, asset: 'archer' },
          { type: 'hero', name: 'HERO', cost: TROOP_STATS.HERO.cost, max: TROOP_STATS.HERO.maxCount, asset: 'knight' },
        ].map((unit) => {
          const currentCount = gameState.troops.filter(t => t.team === (isHost ? 'player' : 'opponent') && t.type === unit.type).length;
          const isAtMax = currentCount >= unit.max;

          return (
            <button
              key={unit.type}
              onClick={() => handleSpawn(unit.type as TroopType)}
              disabled={!isStarted || myGold < unit.cost || isAtMax}
              className="glass-button h-28 flex flex-col items-center justify-center gap-1 group relative overflow-hidden rounded-2xl disabled:opacity-20"
            >
              <img src={`/assets/${unit.asset}.png`} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-white/80">{unit.name}</span>
                <span className={`text-[8px] font-black ${isAtMax ? 'text-error' : 'text-white/30'}`}>[{currentCount}/{unit.max}]</span>
              </div>
            </button>
          );
        })}

        <button onClick={handleUpgrade} disabled={!isStarted || (isHost ? gameState.playerCastle.level >= 3 : gameState.opponentCastle.level >= 3)} className="glass-button h-28 flex flex-col items-center justify-center gap-2 group rounded-2xl disabled:opacity-20">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-gold/50 transition-colors">
                <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 11l7-7 7 7M5 19l7-7 7 7" /></svg>
            </div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/80">Rank {(isHost ? gameState.playerCastle.level : gameState.opponentCastle.level)}</span>
        </button>
      </div>

    </main>
  );
}
