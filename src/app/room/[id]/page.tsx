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

  const [isTraining, setIsTraining] = useState(false);
  const isStarted = isGameStarted || isTraining;

  const handleStartCpu = (diff: 'easy' | 'medium' | 'hard') => {
    engine.setMultiplayer(false);
    engine.setCpuDifficulty(diff);
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
    const gold = isHost ? gameState.gold : gameState.opponentGold;
    if (gold < TROOP_STATS[type.toUpperCase() as keyof typeof TROOP_STATS].cost) return;
    engine.spawnTroop(team, type);
    if (!isTraining) sendSpawn(team, type);
    setGameState(engine.getState());
  };

  const handleUpgrade = () => {
    if (!isStarted) return;
    const team = isHost ? 'player' : 'opponent';
    const gold = isHost ? gameState.gold : gameState.opponentGold;
    const castle = team === 'player' ? gameState.playerCastle : gameState.opponentCastle;
    const nextLevel = (castle.level + 1) as 2 | 3;
    const upgrade = CASTLE_UPGRADES[nextLevel];
    if (!upgrade || gold < upgrade.cost) return;
    engine.upgradeCastle(team);
    if (!isTraining) sendSpawn(team, 'upgrade');
    setGameState(engine.getState());
  };

  const handleAbility = (type: string) => {
    if (!isStarted) return;
    engine.useAbility(isHost ? 'player' : 'opponent', type as any);
    if (!isTraining) sendSpawn(isHost ? 'player' : 'opponent', `ability_${type}`);
    setGameState(engine.getState());
  };

  const myGold = isHost ? gameState.gold : gameState.opponentGold;
  const enemyGold = isHost ? gameState.opponentGold : gameState.gold;

  const playerVisionX = Math.max(...gameState.troops.filter(t => t.team === 'player').map(t => t.x), 400);
  const isOpponentVisible = gameState.troops.some(t => t.team === 'opponent' && t.x < playerVisionX + 600);
  const enemyGoldDisplay = isOpponentVisible ? `$${enemyGold}` : '???';
  const myStats = isHost ? gameState.stats.player : gameState.stats.opponent;
  
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
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Mode</span>
            <span className="text-lg font-mono font-bold text-success">{isTraining ? 'TRAINING' : 'MULTIPLAYER'}</span>
          </div>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="space-y-1">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Confirmed Kills</span>
            <span className="text-lg font-mono font-bold text-error">{myStats.kills}</span>
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
                <span className="text-3xl font-bold text-white/20 tracking-tighter">{enemyGoldDisplay}</span>
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
          
          {!isStarted && (
            <LobbyOverlay roomId={roomId} isHost={isHost} onCopy={() => {}} onStartCpu={handleStartCpu} />
          )}

          {/* Minimap */}
          <div className="absolute top-6 right-6 w-80 h-20 glass-panel rounded-2xl overflow-hidden border-white/10 pointer-events-none">
             <div className="relative w-full h-full bg-black/40 backdrop-blur-md">
                {/* Viewport Indicator */}
                <div 
                  className="absolute top-0 h-full border border-gold/40 bg-gold/5" 
                  style={{ 
                    left: `${(gameState.cameraX / 4000) * 100}%`, 
                    width: `${(1600 / 4000) * 100}%` 
                  }}
                />
                {/* Castles */}
                <div className="absolute left-0 bottom-2 w-4 h-4 bg-success/60 rounded-sm" style={{ left: '2.5%' }} />
                <div className="absolute right-0 bottom-2 w-4 h-4 bg-error/60 rounded-sm" style={{ left: '91.25%' }} />
                {/* Objective */}
                <div className="absolute bottom-2 w-2 h-2 bg-gold/60 rounded-full" style={{ left: '50%', transform: 'translateX(-50%)' }} />
                {/* Troops */}
                {gameState.troops.map(t => (
                  <div 
                    key={t.id} 
                    className={`absolute bottom-2 w-1 h-1 rounded-full ${t.team === 'player' ? 'bg-success' : 'bg-error'}`}
                    style={{ left: `${(t.x / 4000) * 100}%` }}
                  />
                ))}
             </div>
          </div>

          <GameOverOverlay 
            status={gameState.status} 
            onRestart={() => engine.reset()} 
            onExit={handleExit}
          />

          {/* Staging Commands */}
          {isStarted && (
            <div className="absolute bottom-10 left-10 flex flex-col gap-3 animate-fade-in pointer-events-auto">
               <button
                onClick={() => handleCommand('charge')}
                className="px-8 py-4 bg-success text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(50,215,75,0.4)]"
               >
                 CHARGE
               </button>
               <button
                onClick={() => handleCommand('retreat')}
                className="px-8 py-4 bg-error text-white font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,69,58,0.4)]"
               >
                 RETREAT
               </button>
            </div>
          )}

          {/* Emote Wheel */}
          {isStarted && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-4 animate-fade-in pointer-events-auto">
               {['⚔️', '🛡️', '🔥', '👑'].map(emoji => (
                 <button
                  key={emoji}
                  onClick={() => handleEmote(emoji)}
                  className="w-12 h-12 flex items-center justify-center glass-panel rounded-full text-xl hover:scale-110 active:scale-90 transition-all border-white/10"
                 >
                   {emoji}
                 </button>
               ))}
            </div>
          )}

          {isStarted && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 animate-fade-in pointer-events-auto">
               {(['meteor', 'heal', 'shield'] as const).map(id => {
                 const abilities = isHost ? gameState.playerAbilities : gameState.opponentAbilities;
                 const data = abilities[id];
                 const isReady = Date.now() - data.lastUsed >= data.cooldown;
                 const name = id.charAt(0).toUpperCase() + id.slice(1);
                 const colors = { meteor: 'text-error', heal: 'text-success', shield: 'text-gold' };
                 
                 return (
                   <button
                    key={id}
                    onClick={() => handleAbility(id)}
                    disabled={!isReady}
                    className={`px-6 py-2 glass-panel rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isReady ? `${colors[id]} border-white/20 hover:scale-105 active:scale-95` : 'opacity-20 scale-90'}`}
                   >
                     {name}
                   </button>
                 )
               })}
            </div>
          )}
        </div>
      </div>

      {/* Command Interface */}
      <div className="max-w-[1200px] w-full mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 px-4 animate-fade-in">
        {[
          { type: 'basic', name: 'Knight', asset: 'knight.png', cost: TROOP_STATS.BASIC.cost, max: TROOP_STATS.BASIC.maxCount },
          { type: 'archer', name: 'Archer', asset: 'archer.png', cost: TROOP_STATS.ARCHER.cost, max: TROOP_STATS.ARCHER.maxCount },
          { type: 'berserker', name: 'Slayer', asset: 'berserker.png', cost: TROOP_STATS.BERSERKER.cost, max: TROOP_STATS.BERSERKER.maxCount },
          { type: 'hero', name: 'HERO', asset: 'knight.png', cost: TROOP_STATS.HERO.cost, max: TROOP_STATS.HERO.maxCount },
        ].map((unit) => {
          const currentCount = gameState.troops.filter(t => t.team === (isHost ? 'player' : 'opponent') && t.type === unit.type).length;
          const isAtMax = currentCount >= unit.max;

          return (
            <button
              key={unit.type}
              onClick={() => handleSpawn(unit.type as TroopType)}
              disabled={!isStarted || myGold < unit.cost || isAtMax}
              className="glass-button h-40 flex flex-col items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-20 disabled:grayscale transition-all duration-500 rounded-3xl"
            >
              <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img src={`/assets/${unit.asset}`} className="w-20 h-20 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
              <div className="text-center">
                <span className="block text-sm font-bold uppercase tracking-widest text-white/80 group-hover:text-white">{unit.name}</span>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] text-gold font-black tracking-[0.2em]">${unit.cost}</span>
                    <span className={`text-[10px] font-black ${isAtMax ? 'text-error' : 'text-white/30'}`}>[{currentCount}/{unit.max}]</span>
                </div>
              </div>
            </button>
          );
        })}

        <button
          onClick={handleUpgrade}
          disabled={!isStarted || (isHost ? gameState.playerCastle.level >= 3 : gameState.opponentCastle.level >= 3)}
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


