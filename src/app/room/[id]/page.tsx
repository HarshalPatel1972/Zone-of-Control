'use client';

import React, { useEffect, useState, useRef } from 'react';
import { GameEngine, TROOP_STATS, CASTLE_UPGRADES } from '@/engine/GameEngine';
import { GameState, TroopType, Team, AbilityType } from '@/engine/types';
import { GameCanvas } from '@/components/GameCanvas';
import { LobbyOverlay } from '@/components/LobbyOverlay';
import { GameOverOverlay } from '@/components/GameOverOverlay';
import { useMultiplayer } from '@/hooks/useMultiplayer';

export default function RoomPage({ params }: { params: { id: string } }) {
  const roomId = params?.id || 'UNKNOWN';
  const [engine] = useState(() => new GameEngine());
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [isStarted, setIsStarted] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState<'none' | 'recruit' | 'spells'>('none');

  const { role, sendSpawn } = useMultiplayer(roomId, (team, type) => {
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

  const isHost = role === 'host' || isTraining;

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
        if (e.key === 'Escape') setTargetingAbility(null);
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
        setActiveTab('none');
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
    } else if (activeTab !== 'none') {
        setActiveTab('none');
    }
  };

  const handleCommand = (cmd: 'charge' | 'retreat') => {
    if (!isStarted) return;
    engine.issueCommand(isHost ? 'player' : 'opponent', cmd);
    if (!isTraining) sendSpawn(isHost ? 'player' : 'opponent', `cmd_${cmd}`);
    setGameState(engine.getState());
  };

  const myGold = isHost ? gameState.gold : gameState.opponentGold;
  const enemyGold = isHost ? gameState.opponentGold : gameState.gold;
  const myStats = isHost ? gameState.stats.player : gameState.stats.opponent;

  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center font-inter select-none touch-none overflow-hidden">
      
      {/* HUD - Floating Minimalist (Mobile First) */}
      <div className="absolute top-0 inset-x-0 z-30 pointer-events-none p-4 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="px-4 py-2 glass-panel bg-black/60 rounded-xl flex items-center gap-3 border-gold/30">
            <span className="text-xl sm:text-2xl font-black text-gold">${myGold}</span>
            <div className="h-4 w-px bg-white/20"></div>
            <span className="text-xs font-bold text-white/60 tracking-widest uppercase">{myStats.kills} KILLS</span>
          </div>
          <div className="px-2 py-0.5 text-[8px] font-black tracking-widest text-white/20 uppercase">Sector {roomId.substring(0,4)}</div>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <button onClick={() => window.location.href = '/'} className="p-2 bg-error/20 border border-error/40 rounded-full text-error backdrop-blur-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="px-3 py-1 bg-black/60 rounded-lg border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-tighter">OPP: ${enemyGold > 0 ? enemyGold : '???'}</div>
        </div>
      </div>

      {/* Main Game Surface */}
      <div className={`relative w-full h-full flex-1 ${targetingAbility ? 'cursor-crosshair' : ''}`}>
        <GameCanvas engine={engine} onClick={onCanvasClick} />
        
        {/* Targeting Feedback */}
        {targetingAbility && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-pulse pointer-events-none">
              <div className="px-6 py-3 glass-panel bg-gold/30 border-gold rounded-full shadow-[0_0_50px_rgba(226,183,89,0.5)]">
                  <span className="text-white font-black uppercase tracking-widest text-sm sm:text-lg italic">Select Target for {targetingAbility}</span>
              </div>
          </div>
        )}

        {!isStarted && <LobbyOverlay roomId={roomId} isHost={isHost} onCopy={() => {}} onStartCpu={handleStartCpu} />}
        <GameOverOverlay status={gameState.status} onRestart={() => engine.reset()} onExit={() => window.location.href = '/'} />

        {/* Tactical Command Buttons (Bottom Left/Right) */}
        {isStarted && (
          <>
            <div className="absolute bottom-32 left-4 z-40 flex flex-col gap-2">
               <button onClick={() => handleCommand('charge')} className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-success/80 border-4 border-success shadow-2xl flex items-center justify-center text-white font-black text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 active:scale-90 transition-all">CHARGE</button>
               <button onClick={() => handleCommand('retreat')} className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-error/80 border-4 border-error shadow-2xl flex items-center justify-center text-white font-black text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 active:scale-90 transition-all">RETREAT</button>
            </div>

            {/* Minimap - Floating Top Right */}
            <div className="absolute top-4 right-20 w-32 h-8 glass-panel rounded overflow-hidden border-white/10 pointer-events-none hidden sm:block">
              <div className="relative w-full h-full bg-black/40 backdrop-blur-md">
                  <div className="absolute top-0 h-full border border-gold/40 bg-gold/5" style={{ left: `${(gameState.cameraX / 4000) * 100}%`, width: `${(1600 / 4000) * 100}%` }} />
                  {gameState.troops.map(t => <div key={t.id} className={`absolute bottom-0.5 w-0.5 h-0.5 rounded-full ${t.team === 'player' ? 'bg-success' : 'bg-error'}`} style={{ left: `${(t.x / 4000) * 100}%` }} />)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile-Native Bottom Menu System */}
      {isStarted && (
        <div className="w-full bg-[#09090b] border-t border-white/10 px-4 pb-8 pt-4 z-50">
          
          {/* Sub-menu Overlays */}
          {activeTab === 'recruit' && (
            <div className="absolute bottom-[140px] inset-x-4 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 grid grid-cols-3 gap-4 animate-slide-up shadow-2xl">
              {[
                { type: 'basic', name: 'Knight', cost: TROOP_STATS.BASIC.cost, asset: 'knight' },
                { type: 'archer', name: 'Archer', cost: TROOP_STATS.ARCHER.cost, asset: 'archer' },
                { type: 'berserker', name: 'Slayer', cost: TROOP_STATS.BERSERKER.cost, asset: 'berserker' },
                { type: 'fire_archer', name: 'Fire', cost: TROOP_STATS.FIRE_ARCHER.cost, asset: 'archer' },
                { type: 'crossman', name: 'Cross', cost: TROOP_STATS.CROSSMAN.cost, asset: 'archer' },
                { type: 'hero', name: 'HERO', cost: TROOP_STATS.HERO.cost, asset: 'knight' },
                { type: 'dragon', name: 'DRAGON', cost: TROOP_STATS.DRAGON.cost, asset: 'berserker' },
                { type: 'angel', name: 'ANGEL', cost: TROOP_STATS.ANGEL.cost, asset: 'knight' },
                { type: 'tank', name: 'TANK', cost: TROOP_STATS.TANK.cost, asset: 'berserker' },
              ].map((unit) => {
                const currentCount = gameState.troops.filter(t => t.team === (isHost ? 'player' : 'opponent') && t.type === unit.type).length;
                const isAtMax = currentCount >= ((TROOP_STATS as any)[unit.type.toUpperCase()]?.maxCount || 0);
                const canAfford = myGold >= unit.cost;

                return (
                  <button
                    key={unit.type}
                    onClick={() => handleSpawn(unit.type as TroopType)}
                    disabled={!canAfford || isAtMax}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
                  >
                    <img src={`/assets/${unit.asset}.png`} className="w-10 h-10 object-contain mb-2" />
                    <span className="text-[10px] font-bold text-white/80 uppercase">{unit.name}</span>
                    <span className="text-[8px] font-black text-gold">${unit.cost}</span>
                  </button>
                );
              })}
              <button onClick={handleUpgrade} disabled={(isHost ? gameState.playerCastle.level >= 3 : gameState.opponentCastle.level >= 3)} className="col-span-3 py-4 bg-gold/20 border border-gold/40 rounded-xl text-gold font-black text-xs uppercase tracking-widest">
                UPGRADE CASTLE (LVL {(isHost ? gameState.playerCastle.level : gameState.opponentCastle.level)})
              </button>
            </div>
          )}

          {activeTab === 'spells' && (
            <div className="absolute bottom-[140px] inset-x-4 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-4 animate-slide-up shadow-2xl">
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
                    className={`py-4 rounded-xl border border-white/10 font-black text-[10px] uppercase tracking-widest transition-all ${isReady ? `${colors[id] || 'text-white'} bg-white/5 active:bg-white/10` : 'opacity-20'}`}
                   >
                     {name}
                   </button>
                 )
               })}
            </div>
          )}
          
          {/* Main Action Tabs */}
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab(activeTab === 'recruit' ? 'none' : 'recruit')}
              className={`flex-1 py-5 rounded-2xl flex flex-col items-center gap-1 transition-all ${activeTab === 'recruit' ? 'bg-gold text-black shadow-[0_0_30px_rgba(226,183,89,0.4)]' : 'bg-white/5 text-white/60 border border-white/10'}`}
            >
              <span className="text-xs font-black uppercase tracking-[0.2em]">RECRUIT</span>
              <span className="text-[8px] font-bold opacity-60">Troops & Upgrades</span>
            </button>

            <button 
              onClick={() => setActiveTab(activeTab === 'spells' ? 'none' : 'spells')}
              className={`flex-1 py-5 rounded-2xl flex flex-col items-center gap-1 transition-all ${activeTab === 'spells' ? 'bg-gold text-black shadow-[0_0_30px_rgba(226,183,89,0.4)]' : 'bg-white/5 text-white/60 border border-white/10'}`}
            >
              <span className="text-xs font-black uppercase tracking-[0.2em]">SPELLS</span>
              <span className="text-[8px] font-bold opacity-60">Offense & Defense</span>
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
