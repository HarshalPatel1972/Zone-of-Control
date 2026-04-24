'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GameCanvas } from '@/components/GameCanvas';
import { GameOverOverlay } from '@/components/GameOverOverlay';
import { LobbyOverlay } from '@/components/LobbyOverlay';
import { GameEngine, TROOP_STATS } from '@/engine/GameEngine';
import { useMultiplayer } from '@/hooks/useMultiplayer';

export default function RoomPage() {
  const { id: roomId } = useParams() as { id: string };
  const engine = useMemo(() => new GameEngine(), []);
  const [gameState, setGameState] = useState(engine.getState());

  // Initialize engine for multiplayer
  useEffect(() => {
    engine.setMultiplayer(true);
  }, [engine]);

  const { isGameStarted, role, sendSpawn } = useMultiplayer(roomId, (team, type) => {
    engine.spawnRemoteTroop(team);
    setGameState(engine.getState());
  });

  const isHost = role === 'host';

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
    
    // If Host, we are 'player'. If Guest, we are 'opponent'.
    const myTeam = isHost ? 'player' : 'opponent';
    
    // Check gold locally
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
    <main className="min-h-screen bg-[#F0F0F0] p-8 flex flex-col items-center justify-center font-mono overflow-hidden">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <header className="bg-black text-white p-6 border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Zone of Control</h1>
            <p className="text-sm mt-2 opacity-80 italic underline decoration-white/40">Multiplayer Lobby // Room: {roomId}</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-zinc-800 text-white p-4 border-[4px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
              <span className="block text-[10px] font-black uppercase opacity-50">Enemy Funds</span>
              <span className="text-xl font-black">${enemyGold}</span>
            </div>
            
            <div className="bg-white text-black p-4 border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
              <span className="block text-xs font-black uppercase opacity-50">My Treasury</span>
              <span className="text-3xl font-black">${myGold}</span>
            </div>
          </div>
        </header>

        {/* Game Area */}
        <div className="relative border-[10px] border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] bg-white">
          <GameCanvas engine={engine} />
          
          {!isGameStarted && (
            <LobbyOverlay 
              roomId={roomId} 
              isHost={isHost} 
              onCopy={() => console.log('Link copied')} 
            />
          )}

          <GameOverOverlay status={gameState.status} onRestart={handleRestart} />
        </div>

        {/* UI Controls */}
        <div className="bg-white p-8 border-[6px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-6 items-center">
          <div className="relative group">
            <button
              onClick={handleSpawnTroop}
              disabled={!canAfford || !isGameStarted}
              className={`px-8 py-4 text-xl font-bold uppercase border-[4px] border-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                canAfford && isGameStarted
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
              <span className="block opacity-50">Role</span>
              <span className="text-2xl">{isHost ? 'Host (Left)' : 'Guest (Right)'}</span>
            </div>
            <div className="border-l-4 border-black pl-4">
              <span className="block opacity-50">Connection</span>
              <span className="text-2xl text-green-600">{isGameStarted ? 'Synced' : 'Waiting'}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
