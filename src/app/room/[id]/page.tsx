'use client';

import React, { useEffect, useState } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    engine.reset();
    setIsStarted(false);
    setIsTraining(false);
    setGameState(engine.getState());
  }, [roomId, engine]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { role, sendSpawn, isGameStarted } = useMultiplayer(roomId, (team, type) => {
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

  useEffect(() => {
    if (role) engine.setMultiplayer(true);
  }, [role, engine]);

  useEffect(() => {
    if (isGameStarted) setIsStarted(true);
  }, [isGameStarted]);

  const isHost = role === 'host' || isTraining;

  const handleStartCpu = (diff: any, mode: any) => {
    engine.setMode(mode || 'normal');
    setIsStarted(true);
    setIsTraining(true);
    setGameState(engine.getState());
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

  // Render components
  const SpawnerGrid = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-2 w-full max-w-[1400px]">
        {[
            { type: 'basic', name: 'Knight', asset: 'knight' },
            { type: 'archer', name: 'Archer', asset: 'archer' },
            { type: 'berserker', name: 'Slayer', asset: 'berserker' },
            { type: 'fire_archer', name: 'Fire', asset: 'archer' },
            { type: 'crossman', name: 'Cross', asset: 'archer' },
            { type: 'hero', name: 'HERO', asset: 'hero' },
            { type: 'dragon', name: 'DRAGON', asset: 'dragon' },
            { type: 'angel', name: 'ANGEL', asset: 'angel' },
            { type: 'tank', name: 'TANK', asset: 'tank' },
        ].map((unit) => {
            const cost = (TROOP_STATS as any)[unit.type.toUpperCase()]?.cost || 0;
            const currentCount = gameState.troops.filter(t => t.team === (isHost ? 'player' : 'opponent') && t.type === unit.type).length;
            const maxCount = (TROOP_STATS as any)[unit.type.toUpperCase()]?.maxCount || 0;
            const isAtMax = currentCount >= maxCount;

            return (
                <button
                    key={unit.type}
                    onClick={() => handleSpawn(unit.type as TroopType)}
                    disabled={!isStarted || myGold < cost || isAtMax}
                    className="glass-button flex flex-col items-center justify-center p-4 h-32 rounded-2xl group active:scale-95 disabled:opacity-20"
                >
                    <img src={`/assets/${unit.asset}.png`} className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase text-white/80">{unit.name}</span>
                    <span className="text-[12px] font-black text-gold">${cost}</span>
                    <span className="text-[8px] font-bold text-white/20">[{currentCount}/{maxCount}]</span>
                </button>
            );
        })}
        <button onClick={handleUpgrade} disabled={!isStarted || (isHost ? gameState.playerCastle.level >= 3 : gameState.opponentCastle.level >= 3)} className="glass-button flex flex-col items-center justify-center p-4 h-32 rounded-2xl group active:scale-95 disabled:opacity-20">
            <div className="w-8 h-8 mb-2 flex items-center justify-center rounded bg-gold/10 text-gold border border-gold/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 11l7-7 7 7M5 19l7-7 7 7" /></svg>
            </div>
            <span className="text-[10px] font-bold uppercase text-white/80">Upgrade</span>
            <span className="text-[10px] font-black text-gold">RANK {isHost ? gameState.playerCastle.level : gameState.opponentCastle.level}</span>
        </button>
    </div>
  );

  return (
    <main className="fixed inset-0 bg-[#09090b] flex flex-col items-center font-inter select-none touch-none overflow-hidden text-white">
      
      {/* DESKTOP HUD (Traditional) */}
      {!isMobile && (
        <div className="w-full flex justify-between items-center p-6 px-12 z-40 glass-panel border-b border-white/5">
            <div className="flex gap-12">
                <div>
                    <span className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Sector {roomId.substring(0,4)}</span>
                    <span className="text-2xl font-black tracking-tight">Theater Command</span>
                </div>
                <div className="h-10 w-px bg-white/10 self-center"></div>
                <div>
                    <span className="block text-[10px] font-black text-gold/40 uppercase tracking-[0.3em]">Treasury</span>
                    <span className="text-3xl font-black text-gold tracking-tighter">${myGold}</span>
                </div>
                <div>
                    <span className="block text-[10px] font-black text-error/40 uppercase tracking-[0.3em]">Tactical Kills</span>
                    <span className="text-3xl font-black text-error tracking-tighter">{myStats.kills}</span>
                </div>
            </div>

            <div className="flex gap-6 items-center">
                <div className="text-right">
                    <span className="block text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Opponent</span>
                    <span className="text-xl font-bold text-white/40">${enemyGold > 0 ? enemyGold : '???'}</span>
                </div>
                <button onClick={() => window.location.href = '/'} className="px-8 py-3 rounded-full glass-panel bg-error/10 border-error/20 text-error text-[10px] font-black uppercase tracking-widest hover:bg-error/20 transition-all">TERMINATE SESSION</button>
            </div>
        </div>
      )}

      {/* MOBILE HUD (Floating) */}
      {isMobile && (
        <div className="absolute top-0 inset-x-0 z-30 pointer-events-none p-4 flex justify-between items-start">
            <div className="flex flex-col gap-1">
                <div className="px-4 py-2 glass-panel bg-black/60 rounded-xl flex items-center gap-3 border-gold/30">
                    <span className="text-xl font-black text-gold">${myGold}</span>
                    <div className="h-4 w-px bg-white/20"></div>
                    <span className="text-xs font-bold text-white/60 uppercase">{myStats.kills} KILLS</span>
                </div>
            </div>
            <button onClick={() => window.location.href = '/'} className="p-2 bg-error/20 border border-error/40 rounded-full text-error backdrop-blur-md pointer-events-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      )}

      {/* GAME SURFACE */}
      <div className={`relative w-full flex-1 overflow-hidden ${targetingAbility ? 'cursor-crosshair' : ''}`}>
        <GameCanvas engine={engine} onClick={onCanvasClick} />
        
        {/* DESKTOP SIDEBAR ABILITIES */}
        {!isMobile && isStarted && (
            <div className="absolute top-1/2 -translate-y-1/2 left-6 z-40 flex flex-col gap-2 pointer-events-auto">
               {(['meteor', 'lightning', 'iceFreeze', 'moon', 'superMeteor', 'heal', 'superHeal', 'shield'] as const).map(id => {
                 const abilities = isHost ? gameState.playerAbilities : gameState.opponentAbilities;
                 const data = abilities[id];
                 const isReady = Date.now() - data.lastUsed >= data.cooldown;
                 const colors: Record<string, string> = { meteor: 'border-error/40 text-error', lightning: 'border-blue-400/40 text-blue-400', iceFreeze: 'border-cyan-300/40 text-cyan-300', moon: 'border-purple-400/40 text-purple-400', superMeteor: 'border-orange-600/40 text-orange-600', heal: 'border-success/40 text-success', superHeal: 'border-emerald-400/40 text-emerald-400', shield: 'border-gold/40 text-gold' };
                 
                 return (
                   <button
                    key={id}
                    onClick={() => handleAbility(id)}
                    disabled={!isReady}
                    className={`w-14 h-14 rounded-xl border flex items-center justify-center text-[8px] font-black uppercase text-center p-1 transition-all ${isReady ? `${colors[id]} bg-black/60 hover:scale-110` : 'opacity-10 scale-90'}`}
                   >
                     {id.replace(/([A-Z])/g, ' $1')}
                   </button>
                 )
               })}
            </div>
        )}

        {/* DESKTOP COMMANDS */}
        {!isMobile && isStarted && (
            <div className="absolute bottom-6 right-6 z-40 flex gap-4 pointer-events-auto">
                <button onClick={() => handleCommand('charge')} className="px-10 py-5 bg-success text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">CHARGE</button>
                <button onClick={() => handleCommand('retreat')} className="px-10 py-5 bg-error text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">RETREAT</button>
            </div>
        )}

        {/* MOBILE COMMANDS */}
        {isMobile && isStarted && (
            <div className="absolute bottom-32 left-4 z-40 flex flex-col gap-2 pointer-events-auto">
               <button onClick={() => handleCommand('charge')} className="w-16 h-16 rounded-full bg-success/80 border-4 border-success shadow-2xl flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest active:scale-90 transition-all">CHARGE</button>
               <button onClick={() => handleCommand('retreat')} className="w-16 h-16 rounded-full bg-error/80 border-4 border-error shadow-2xl flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest active:scale-90 transition-all">RETREAT</button>
            </div>
        )}

        {/* DESKTOP MINIMAP */}
        {!isMobile && isStarted && (
            <div className="absolute top-6 right-6 w-80 h-20 glass-panel rounded-2xl overflow-hidden pointer-events-none">
                <div className="relative w-full h-full bg-black/40 backdrop-blur-xl">
                    <div className="absolute top-0 h-full border border-gold/40 bg-gold/5" style={{ left: `${(gameState.cameraX / 6000) * 100}%`, width: `${(1600 / 6000) * 100}%` }} />
                    {gameState.troops.map(t => <div key={t.id} className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${t.team === 'player' ? 'bg-success' : 'bg-error'}`} style={{ left: `${(t.x / 6000) * 100}%` }} />)}
                </div>
            </div>
        )}

        {/* TARGETING BANNER */}
        {targetingAbility && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 animate-pulse pointer-events-none">
              <div className="px-10 py-5 glass-panel bg-gold/30 border-gold rounded-full shadow-[0_0_80px_rgba(226,183,89,0.5)]">
                  <span className="text-white font-black uppercase tracking-[0.4em] text-xl italic">Targeting {targetingAbility}</span>
              </div>
          </div>
        )}

        {!isStarted && <LobbyOverlay roomId={roomId} isHost={isHost} onCopy={() => {}} onStartCpu={handleStartCpu} />}
        <GameOverOverlay status={gameState.status} onRestart={() => engine.reset()} onExit={() => window.location.href = '/'} />
      </div>

      {/* FOOTER: SPAWNER (Desktop: Fixed grid | Mobile: Tabs) */}
      {isStarted && (
        <div className="w-full bg-[#09090b] border-t border-white/5 p-6 flex justify-center z-50">
            {!isMobile ? (
                <SpawnerGrid />
            ) : (
                <div className="w-full flex flex-col gap-4">
                    {/* Mobile Sub-menus (same as before) */}
                    {activeTab === 'recruit' && (
                        <div className="absolute bottom-[140px] inset-x-4 bg-black/95 border border-white/10 rounded-[2rem] p-6 grid grid-cols-3 gap-4 animate-slide-up shadow-2xl">
                             {[
                                { type: 'basic', name: 'Knight', asset: 'knight' },
                                { type: 'archer', name: 'Archer', asset: 'archer' },
                                { type: 'berserker', name: 'Slayer', asset: 'berserker' },
                                { type: 'fire_archer', name: 'Fire', asset: 'archer' },
                                { type: 'crossman', name: 'Cross', asset: 'archer' },
                                { type: 'hero', name: 'HERO', asset: 'hero' },
                                { type: 'dragon', name: 'DRAGON', asset: 'dragon' },
                                { type: 'angel', name: 'ANGEL', asset: 'angel' },
                                { type: 'tank', name: 'TANK', asset: 'tank' },
                            ].map((unit) => {
                                const cost = (TROOP_STATS as any)[unit.type.toUpperCase()]?.cost || 0;
                                return (
                                <button key={unit.type} onClick={() => handleSpawn(unit.type as TroopType)} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 transition-all">
                                    <img src={`/assets/${unit.asset}.png`} className="w-10 h-10 object-contain mb-2" />
                                    <span className="text-[8px] font-black text-gold">${cost}</span>
                                </button>
                                );
                            })}
                            <button onClick={handleUpgrade} className="col-span-3 py-4 bg-gold/20 border border-gold/40 rounded-xl text-gold font-black text-xs">UPGRADE CASTLE</button>
                        </div>
                    )}

                    {activeTab === 'spells' && (
                        <div className="absolute bottom-[140px] inset-x-4 bg-black/95 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-4 animate-slide-up shadow-2xl">
                            {(['meteor', 'lightning', 'iceFreeze', 'moon', 'superMeteor', 'heal', 'superHeal', 'shield'] as const).map(id => (
                                <button key={id} onClick={() => handleAbility(id)} className="py-4 rounded-xl border border-white/10 font-black text-[10px] uppercase bg-white/5">{id.replace(/([A-Z])/g, ' $1')}</button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button onClick={() => setActiveTab(activeTab === 'recruit' ? 'none' : 'recruit')} className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest ${activeTab === 'recruit' ? 'bg-gold text-black' : 'bg-white/5 text-white/40 border border-white/10'}`}>RECRUIT</button>
                        <button onClick={() => setActiveTab(activeTab === 'spells' ? 'none' : 'spells')} className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest ${activeTab === 'spells' ? 'bg-gold text-black' : 'bg-white/5 text-white/40 border border-white/10'}`}>SPELLS</button>
                    </div>
                </div>
            )}
        </div>
      )}

    </main>
  );
}
